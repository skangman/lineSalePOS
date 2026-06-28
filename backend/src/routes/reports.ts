import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { query } from '../config/db.js'
import { pushMessage, buildDailySummaryMessage } from '../services/lineService.js'
import { checkFeature } from '../utils/planLimits.js'

const router = Router()

router.use(authMiddleware, shopMiddleware, async (req, res, next) => {
  try { await checkFeature(req.shopId!, 'has_reports'); next() }
  catch (err: any) { res.status(403).json({ error: err.message }) }
})

router.get('/daily', async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query
  const shopId = req.shopId!

  const [summary] = await query(
    `SELECT
      COALESCE(SUM(total),0) as total_sales,
      COUNT(*) as total_orders,
      COALESCE(SUM(discount),0) as total_discount,
      COALESCE(SUM(CASE WHEN payment_method='cash' THEN total ELSE 0 END),0) as cash_total,
      COALESCE(SUM(CASE WHEN payment_method='transfer' THEN total ELSE 0 END),0) as transfer_total,
      COALESCE(SUM(CASE WHEN payment_method='promptpay' THEN total ELSE 0 END),0) as promptpay_total,
      COALESCE(SUM(CASE WHEN payment_method='debt' THEN total ELSE 0 END),0) as debt_total
     FROM orders
     WHERE shop_id=$1 AND DATE(created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND payment_status != 'cancelled'`,
    [shopId, date]
  )

  const topProducts = await query(
    `SELECT oi.product_name, SUM(oi.quantity) as qty, SUM(oi.subtotal) as total
     FROM order_items oi JOIN orders o ON o.id=oi.order_id
     WHERE o.shop_id=$1 AND DATE(o.created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND o.payment_status != 'cancelled'
     GROUP BY oi.product_name ORDER BY qty DESC LIMIT 10`,
    [shopId, date]
  )

  const hourly = await query(
    `SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Bangkok') as hour,
            COUNT(*) as orders, COALESCE(SUM(total),0) as sales
     FROM orders
     WHERE shop_id=$1 AND DATE(created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND payment_status != 'cancelled'
     GROUP BY hour ORDER BY hour`,
    [shopId, date]
  )

  const profit = await query(
    `SELECT COALESCE(SUM(oi.quantity * (oi.price - COALESCE(oi.cost_price,0))),0) as estimated_profit
     FROM order_items oi JOIN orders o ON o.id=oi.order_id
     WHERE o.shop_id=$1 AND DATE(o.created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND o.payment_status != 'cancelled'`,
    [shopId, date]
  )

  res.json({
    date,
    summary,
    top_products: topProducts,
    hourly,
    estimated_profit: profit[0]?.estimated_profit ?? 0,
  })
})

router.post('/close-shop', async (req, res) => {
  const shopId = req.shopId!
  const today = new Date().toISOString().split('T')[0]

  const [summary] = await query(
    `SELECT COALESCE(SUM(total),0) as total_sales, COUNT(*) as total_orders,
            COALESCE(SUM(CASE WHEN payment_method='cash' THEN total ELSE 0 END),0) as cash_total,
            COALESCE(SUM(CASE WHEN payment_method='transfer' THEN total ELSE 0 END),0) as transfer_total,
            COALESCE(SUM(CASE WHEN payment_method='promptpay' THEN total ELSE 0 END),0) as promptpay_total,
            COALESCE(SUM(CASE WHEN payment_method='debt' THEN total ELSE 0 END),0) as debt_total
     FROM orders
     WHERE shop_id=$1 AND DATE(created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND payment_status != 'cancelled'`,
    [shopId, today]
  )

  const dateLabel = new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short', year: 'numeric' })

  try {
    await pushMessage(req.user!.line_user_id, [buildDailySummaryMessage({
      date: dateLabel,
      totalSales: Number(summary.total_sales),
      totalOrders: Number(summary.total_orders),
      cashTotal: Number(summary.cash_total),
      transferTotal: Number(summary.transfer_total),
      promptpayTotal: Number(summary.promptpay_total),
      debtTotal: Number(summary.debt_total),
    })])
  } catch (_) {}

  res.json({ summary, date: today })
})

export default router
