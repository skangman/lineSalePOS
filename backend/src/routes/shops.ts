import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'
import { pushMessage, buildRegisterMessage } from '../services/lineService.js'

const router = Router()

router.post('/register', authMiddleware, async (req, res) => {
  const { shop_name, owner_name, phone, product_type, market_area } = req.body

  if (!shop_name || !owner_name) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อร้านและชื่อเจ้าของ' })
  }

  const userId = req.user!.id
  const lineUserId = req.user!.line_user_id

  try {
    const existing = await queryOne(
      'SELECT id FROM shop_staff WHERE user_id = $1 AND is_active = true',
      [userId]
    )
    if (existing) {
      return res.status(409).json({ error: 'คุณมีร้านค้าอยู่แล้ว' })
    }

    const [shop] = await query(
      `INSERT INTO shops (owner_id, shop_name, owner_name, phone, product_type, market_area)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, shop_name, owner_name, phone, product_type, market_area]
    )

    await query(
      `INSERT INTO shop_staff (shop_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [shop.id, userId]
    )

    await query(
      `INSERT INTO shop_settings (shop_id) VALUES ($1)`,
      [shop.id]
    )

    // Default categories
    const defaultCategories = ['อาหาร', 'เครื่องดื่ม', 'ของหวาน', 'อื่น ๆ']
    for (let i = 0; i < defaultCategories.length; i++) {
      await query(
        'INSERT INTO categories (shop_id, name, sort_order) VALUES ($1, $2, $3)',
        [shop.id, defaultCategories[i], i]
      )
    }

    try {
      await pushMessage(lineUserId, [buildRegisterMessage(shop_name)])
    } catch (_) {
      // non-critical
    }

    res.status(201).json({ shop })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/plans', async (_req, res) => {
  const plans = await query('SELECT * FROM plans ORDER BY price')
  res.json({ plans })
})

router.get('/current', authMiddleware, shopMiddleware, async (req, res) => {
  try {
    const shop = await queryOne(
      `SELECT s.*, p.name as plan_name, p.slug as plan_slug,
              p.max_products, p.max_orders_per_day, p.has_reports, p.has_stock
       FROM shops s JOIN plans p ON p.id = s.plan_id
       WHERE s.id = $1`,
      [req.shopId]
    )
    res.json({ shop })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.put('/:id', authMiddleware, shopMiddleware, async (req, res) => {
  const { shop_name, owner_name, phone, promptpay_number, receipt_footer, voice_enabled, line_notify_enabled, logo_url, market_area, product_type } = req.body

  try {
    const shop = await queryOne(
      `UPDATE shops SET shop_name=$1, owner_name=$2, phone=$3, promptpay_number=$4,
        receipt_footer=$5, voice_enabled=$6, line_notify_enabled=$7, logo_url=$8,
        market_area=$9, product_type=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [shop_name, owner_name, phone, promptpay_number, receipt_footer, voice_enabled, line_notify_enabled, logo_url, market_area, product_type, req.shopId]
    )
    res.json({ shop })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/dashboard', authMiddleware, shopMiddleware, async (req, res) => {
  const shopId = req.shopId!
  const today = new Date().toISOString().split('T')[0]

  try {
    const [summary] = await query(
      `SELECT
        COALESCE(SUM(total),0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN payment_method='cash' THEN total ELSE 0 END),0) as cash_total,
        COALESCE(SUM(CASE WHEN payment_method='transfer' THEN total ELSE 0 END),0) as transfer_total,
        COALESCE(SUM(CASE WHEN payment_method='promptpay' THEN total ELSE 0 END),0) as promptpay_total,
        COALESCE(SUM(CASE WHEN payment_method='debt' THEN total ELSE 0 END),0) as debt_total
       FROM orders
       WHERE shop_id=$1 AND DATE(created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND payment_status != 'cancelled'`,
      [shopId, today]
    )

    const topProducts = await query(
      `SELECT oi.product_name, SUM(oi.quantity) as qty, SUM(oi.subtotal) as total
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.shop_id=$1 AND DATE(o.created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND o.payment_status != 'cancelled'
       GROUP BY oi.product_name ORDER BY qty DESC LIMIT 5`,
      [shopId, today]
    )

    res.json({ summary, top_products: topProducts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
