import { Router } from 'express'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'

const router = Router()

router.use(authMiddleware, adminMiddleware)

router.get('/shops', async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query
  let sql = `SELECT s.*, u.display_name as owner_display, p.name as plan_name,
                    (SELECT COUNT(*) FROM orders WHERE shop_id=s.id AND payment_status!='cancelled') as total_orders
             FROM shops s JOIN users u ON u.id=s.owner_id JOIN plans p ON p.id=s.plan_id WHERE 1=1`
  const params: any[] = []
  if (search) { params.push(`%${search}%`); sql += ` AND (s.shop_name ILIKE $${params.length} OR u.display_name ILIKE $${params.length})` }
  sql += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, offset)

  const rows = await query(sql, params)
  const [{ count }] = await query('SELECT COUNT(*) FROM shops')
  res.json({ shops: rows, total: Number(count) })
})

router.get('/shops/:id', async (req, res) => {
  const shop = await queryOne(
    'SELECT s.*, u.display_name as owner_display FROM shops s JOIN users u ON u.id=s.owner_id WHERE s.id=$1',
    [req.params.id]
  )
  if (!shop) return res.status(404).json({ error: 'ไม่พบร้าน' })
  res.json({ shop })
})

router.patch('/shops/:id/plan', async (req, res) => {
  const { plan_id } = req.body
  const shop = await queryOne('UPDATE shops SET plan_id=$1 WHERE id=$2 RETURNING *', [plan_id, req.params.id])
  res.json({ shop })
})

router.patch('/shops/:id/status', async (req, res) => {
  const { is_active } = req.body
  const shop = await queryOne(
    'UPDATE shops SET is_active=$1 WHERE id=$2 RETURNING *',
    [is_active, req.params.id]
  )
  res.json({ shop })
})

router.get('/plans', async (req, res) => {
  const plans = await query('SELECT * FROM plans ORDER BY price')
  res.json({ plans })
})

router.post('/plans', async (req, res) => {
  const { name, slug, price, max_products, max_orders_per_day, max_staff, has_reports, has_profit_report, has_stock, has_daily_summary_line } = req.body
  const [plan] = await query(
    `INSERT INTO plans (name,slug,price,max_products,max_orders_per_day,max_staff,has_reports,has_profit_report,has_stock,has_daily_summary_line)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [name, slug, price, max_products, max_orders_per_day, max_staff, has_reports, has_profit_report, has_stock, has_daily_summary_line]
  )
  res.status(201).json({ plan })
})

router.put('/plans/:id', async (req, res) => {
  const { name, price, max_products, max_orders_per_day, max_staff, has_reports, has_profit_report, has_stock, has_daily_summary_line } = req.body
  const plan = await queryOne(
    `UPDATE plans SET name=$1,price=$2,max_products=$3,max_orders_per_day=$4,max_staff=$5,
      has_reports=$6,has_profit_report=$7,has_stock=$8,has_daily_summary_line=$9 WHERE id=$10 RETURNING *`,
    [name, price, max_products, max_orders_per_day, max_staff, has_reports, has_profit_report, has_stock, has_daily_summary_line, req.params.id]
  )
  res.json({ plan })
})

router.get('/subscriptions', async (req, res) => {
  const rows = await query(
    `SELECT sub.*, s.shop_name, p.name as plan_name FROM subscriptions sub
     JOIN shops s ON s.id=sub.shop_id JOIN plans p ON p.id=sub.plan_id
     ORDER BY sub.created_at DESC`
  )
  res.json({ subscriptions: rows })
})

// คำขออัปเกรด
router.get('/upgrades', async (_req, res) => {
  const rows = await query(
    `SELECT r.*, s.shop_name, p.name as plan_name, p.price as plan_price
     FROM upgrade_requests r
     JOIN shops s ON s.id = r.shop_id
     JOIN plans p ON p.id = r.plan_id
     WHERE r.status = 'pending'
     ORDER BY r.created_at ASC`
  )
  res.json({ requests: rows })
})

router.patch('/upgrades/:id/approve', async (req, res) => {
  const request = await queryOne('SELECT * FROM upgrade_requests WHERE id=$1', [req.params.id])
  if (!request) return res.status(404).json({ error: 'ไม่พบคำขอ' })

  await query('UPDATE shops SET plan_id=$1 WHERE id=$2', [request.plan_id, request.shop_id])
  await query(`UPDATE upgrade_requests SET status='approved', reviewed_at=NOW() WHERE id=$1`, [req.params.id])

  res.json({ success: true })
})

router.patch('/upgrades/:id/reject', async (req, res) => {
  await query(`UPDATE upgrade_requests SET status='rejected', reviewed_at=NOW() WHERE id=$1`, [req.params.id])
  res.json({ success: true })
})

router.get('/stats', async (_req, res) => {
  const [shopStats] = await query(`SELECT COUNT(*) as total_shops, COUNT(CASE WHEN is_active THEN 1 END) as active_shops FROM shops`)
  const [userStats] = await query(`SELECT COUNT(*) as total_users FROM users`)
  const [orderStats] = await query(`SELECT COUNT(*) as total_orders, COALESCE(SUM(total),0) as total_revenue FROM orders WHERE payment_status!='cancelled'`)
  const planDist = await query(`SELECT p.name, p.slug, COUNT(s.id) as shop_count FROM plans p LEFT JOIN shops s ON s.plan_id=p.id GROUP BY p.id, p.name, p.slug ORDER BY p.price`)
  const [pendingUpgrades] = await query(`SELECT COUNT(*) as count FROM upgrade_requests WHERE status='pending'`)
  const revenue7d = await query(`
    SELECT DATE(created_at AT TIME ZONE 'Asia/Bangkok') as date, COALESCE(SUM(total),0) as revenue, COUNT(*) as orders
    FROM orders WHERE payment_status!='cancelled' AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(created_at AT TIME ZONE 'Asia/Bangkok') ORDER BY date`)
  res.json({ shops: shopStats, users: userStats, orders: orderStats, plan_dist: planDist, pending_upgrades: Number(pendingUpgrades.count), revenue7d })
})

router.get('/settings', async (_req, res) => {
  const rows = await query(`SELECT key, value FROM system_settings`)
  const settings: Record<string, string> = {}
  rows.forEach((r: any) => { settings[r.key] = r.value })
  res.json({ settings })
})

router.put('/settings', async (req, res) => {
  const { promptpay_number } = req.body
  if (promptpay_number !== undefined) {
    await query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ('promptpay_number', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()`,
      [promptpay_number]
    )
  }
  res.json({ success: true })
})

export default router
