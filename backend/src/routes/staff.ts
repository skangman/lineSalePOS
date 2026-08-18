// ⚠️ ปิดใช้งานฟีเจอร์นี้ชั่วคราว — ไม่ได้ mount เข้า app แล้ว (ดู index.ts) เก็บโค้ดไว้เผื่อกลับมาใช้ทีหลัง
import { Router } from 'express'
import { authMiddleware, shopMiddleware, requireRole } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'
import { randomBytes } from 'crypto'
import { checkStaffLimit } from '../utils/planLimits.js'

const router = Router()

router.get('/', authMiddleware, shopMiddleware, async (req, res) => {
  const rows = await query(
    `SELECT ss.*, u.display_name, u.picture_url, u.line_user_id
     FROM shop_staff ss JOIN users u ON u.id=ss.user_id
     WHERE ss.shop_id=$1 AND ss.is_active=true`,
    [req.shopId]
  )
  res.json({ staff: rows })
})

router.post('/invite', authMiddleware, shopMiddleware, requireRole('owner', 'manager'), async (req, res) => {
  const { role = 'cashier' } = req.body

  try { await checkStaffLimit(req.shopId!) } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }

  const inviteCode = randomBytes(4).toString('hex').toUpperCase()

  await query(
    `INSERT INTO shop_staff (shop_id, user_id, role, invite_code, is_active)
     VALUES ($1, $2, $3, $4, false)
     ON CONFLICT DO NOTHING`,
    [req.shopId, req.user!.id, role, inviteCode]
  )

  res.json({ invite_code: inviteCode })
})

router.post('/join', authMiddleware, async (req, res) => {
  const { invite_code } = req.body
  if (!invite_code) return res.status(400).json({ error: 'กรุณากรอกรหัสเชิญ' })

  const pending = await queryOne(
    'SELECT * FROM shop_staff WHERE invite_code=$1 AND is_active=false',
    [invite_code.toUpperCase()]
  )
  if (!pending) return res.status(404).json({ error: 'รหัสเชิญไม่ถูกต้องหรือหมดอายุ' })

  const existing = await queryOne(
    'SELECT id FROM shop_staff WHERE shop_id=$1 AND user_id=$2 AND is_active=true',
    [pending.shop_id, req.user!.id]
  )
  if (existing) return res.status(409).json({ error: 'คุณเป็นพนักงานร้านนี้อยู่แล้ว' })

  await query(
    `INSERT INTO shop_staff (shop_id, user_id, role) VALUES ($1,$2,$3)
     ON CONFLICT (shop_id, user_id) DO UPDATE SET is_active=true`,
    [pending.shop_id, req.user!.id, pending.role]
  )

  await query('DELETE FROM shop_staff WHERE invite_code=$1 AND is_active=false', [invite_code.toUpperCase()])

  const shop = await queryOne('SELECT shop_name FROM shops WHERE id=$1', [pending.shop_id])
  res.json({ success: true, shop_name: shop?.shop_name, role: pending.role })
})

router.delete('/:id', authMiddleware, shopMiddleware, requireRole('owner', 'manager'), async (req, res) => {
  const staff = await queryOne('SELECT * FROM shop_staff WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId])
  if (!staff) return res.status(404).json({ error: 'ไม่พบพนักงาน' })
  if (staff.role === 'owner') return res.status(403).json({ error: 'ไม่สามารถลบเจ้าของร้านได้' })

  await query('UPDATE shop_staff SET is_active=false WHERE id=$1', [req.params.id])
  res.json({ success: true })
})

export default router
