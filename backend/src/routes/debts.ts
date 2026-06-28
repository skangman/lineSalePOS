import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { query, queryOne, pool } from '../config/db.js'
import { pushMessage, buildDebtPaidMessage } from '../services/lineService.js'

const router = Router()

router.use(authMiddleware, shopMiddleware)

// รายการหนี้ทั้งหมด (จัดกลุ่มตามลูกค้า)
router.get('/', async (req, res) => {
  const { status = 'unpaid' } = req.query
  const rows = await query(
    `SELECT d.*, o.order_no, o.created_at as order_date
     FROM debts d JOIN orders o ON o.id = d.order_id
     WHERE d.shop_id = $1 ${status === 'all' ? '' : 'AND d.is_paid = false'}
     ORDER BY d.created_at DESC`,
    [req.shopId]
  )
  res.json({ debts: rows })
})

// สรุปยอดค้างต่อลูกค้า
router.get('/summary', async (req, res) => {
  const rows = await query(
    `SELECT customer_name,
            COUNT(*) as bill_count,
            SUM(amount) as total_amount,
            SUM(paid_amount) as total_paid,
            SUM(amount - paid_amount) as remaining
     FROM debts
     WHERE shop_id = $1 AND is_paid = false
     GROUP BY customer_name
     ORDER BY remaining DESC`,
    [req.shopId]
  )
  res.json({ summary: rows })
})

// รับชำระหนี้
router.patch('/:id/pay', async (req, res) => {
  const { pay_amount } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const debt = await queryOne(
      'SELECT * FROM debts WHERE id=$1 AND shop_id=$2',
      [req.params.id, req.shopId]
    )
    if (!debt) throw new Error('ไม่พบรายการหนี้')
    if (debt.is_paid) throw new Error('ชำระแล้ว')

    const amount = pay_amount ?? debt.amount
    const newPaid = Number(debt.paid_amount) + Number(amount)
    const isPaid = newPaid >= Number(debt.amount)

    const { rows: [updated] } = await client.query(
      `UPDATE debts SET paid_amount=$1, is_paid=$2, paid_at=$3 WHERE id=$4 RETURNING *`,
      [newPaid, isPaid, isPaid ? new Date() : null, req.params.id]
    )

    if (isPaid) {
      await client.query(
        `UPDATE orders SET payment_status='paid', updated_at=NOW() WHERE id=$1`,
        [debt.order_id]
      )
    }

    await client.query('COMMIT')

    // LINE notification + ดึง order_no สำหรับข้อความ
    if (isPaid) {
      const order = await queryOne('SELECT order_no FROM orders WHERE id=$1', [debt.order_id])
      pushMessage(req.user!.line_user_id, [buildDebtPaidMessage({
        customerName: debt.customer_name,
        orderNo: order?.order_no || '',
        amount: Number(debt.amount),
      })]).catch(() => {})
    }

    res.json({ debt: updated })
  } catch (err: any) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default router
