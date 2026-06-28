import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'

const router = Router()

// ดึง PromptPay ของแอดมินสำหรับแสดง QR (ดึงจาก DB ก่อน ถ้าไม่มีใช้ env)
router.get('/payment-info', async (_req, res) => {
  const row = await queryOne(`SELECT value FROM system_settings WHERE key='promptpay_number'`, [])
  res.json({ promptpay: row?.value || process.env.ADMIN_PROMPTPAY || '' })
})

// ลูกค้าส่งคำขออัปเกรด
router.post('/', authMiddleware, shopMiddleware, async (req, res) => {
  const { plan_id, note, slip_url } = req.body
  if (!plan_id) return res.status(400).json({ error: 'กรุณาเลือกแพ็คเกจ' })

  const plan = await queryOne('SELECT * FROM plans WHERE id=$1', [plan_id])
  if (!plan) return res.status(404).json({ error: 'ไม่พบแพ็คเกจ' })

  const shop = await queryOne('SELECT plan_id FROM shops WHERE id=$1', [req.shopId])
  if (shop?.plan_id === plan_id) return res.status(400).json({ error: 'คุณใช้แพ็คเกจนี้อยู่แล้ว' })

  // ยกเลิก pending เดิมก่อน
  await query(`UPDATE upgrade_requests SET status='cancelled' WHERE shop_id=$1 AND status='pending'`, [req.shopId])

  const [request] = await query(
    `INSERT INTO upgrade_requests (shop_id, plan_id, amount, slip_url) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.shopId, plan_id, plan.price, slip_url || null]
  )

  res.status(201).json({ request })
})

// ดึงสถานะคำขอล่าสุดของร้าน
router.get('/my', authMiddleware, shopMiddleware, async (req, res) => {
  const request = await queryOne(
    `SELECT r.*, p.name as plan_name FROM upgrade_requests r
     JOIN plans p ON p.id = r.plan_id
     WHERE r.shop_id=$1 ORDER BY r.created_at DESC LIMIT 1`,
    [req.shopId]
  )
  res.json({ request })
})

export default router
