import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'
import { checkProductLimit } from '../utils/planLimits.js'

const router = Router()

router.get('/', authMiddleware, shopMiddleware, async (req, res) => {
  const { category_id, active_only } = req.query
  let sql = `SELECT p.*, c.name as category_name
             FROM products p LEFT JOIN categories c ON c.id = p.category_id
             WHERE p.shop_id=$1`
  const params: any[] = [req.shopId]

  if (active_only === 'true') { sql += ' AND p.is_active=true'; }
  if (category_id) { params.push(category_id); sql += ` AND p.category_id=$${params.length}`; }
  sql += ' ORDER BY p.sort_order, p.product_name'

  const rows = await query(sql, params)
  res.json({ products: rows })
})

router.post('/', authMiddleware, shopMiddleware, async (req, res) => {
  const { product_name, category_id, price, cost_price, image_url, stock_quantity = 0, is_unlimited_stock = false, sort_order = 0 } = req.body
  if (!product_name || price == null) {
    return res.status(400).json({ error: 'กรุณากรอกชื่อสินค้าและราคา' })
  }
  try { await checkProductLimit(req.shopId!) } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }
  const [p] = await query(
    `INSERT INTO products (shop_id, category_id, product_name, price, cost_price, image_url, stock_quantity, is_unlimited_stock, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.shopId, category_id || null, product_name, price, cost_price || null, image_url || null, stock_quantity, is_unlimited_stock, sort_order]
  )
  res.status(201).json({ product: p })
})

router.get('/:id', authMiddleware, shopMiddleware, async (req, res) => {
  const p = await queryOne('SELECT * FROM products WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId])
  if (!p) return res.status(404).json({ error: 'ไม่พบสินค้า' })
  res.json({ product: p })
})

router.put('/:id', authMiddleware, shopMiddleware, async (req, res) => {
  const { product_name, category_id, price, cost_price, image_url, stock_quantity, is_unlimited_stock, sort_order } = req.body
  const p = await queryOne(
    `UPDATE products SET product_name=$1, category_id=$2, price=$3, cost_price=$4,
      image_url=$5, stock_quantity=$6, is_unlimited_stock=$7, sort_order=$8, updated_at=NOW()
     WHERE id=$9 AND shop_id=$10 RETURNING *`,
    [product_name, category_id || null, price, cost_price || null, image_url || null, stock_quantity, is_unlimited_stock, sort_order, req.params.id, req.shopId]
  )
  if (!p) return res.status(404).json({ error: 'ไม่พบสินค้า' })
  res.json({ product: p })
})

router.delete('/:id', authMiddleware, shopMiddleware, async (req, res) => {
  await query('UPDATE products SET is_active=false WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId])
  res.json({ success: true })
})

router.patch('/:id/toggle-active', authMiddleware, shopMiddleware, async (req, res) => {
  const p = await queryOne(
    'UPDATE products SET is_active = NOT is_active, updated_at=NOW() WHERE id=$1 AND shop_id=$2 RETURNING *',
    [req.params.id, req.shopId]
  )
  if (!p) return res.status(404).json({ error: 'ไม่พบสินค้า' })
  res.json({ product: p })
})

export default router
