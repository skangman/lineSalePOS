import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { queryOne } from '../config/db.js'
import { pushMessage } from '../services/lineService.js'
import type { Message } from '@line/bot-sdk'

const router = Router()

router.get('/:orderId', authMiddleware, shopMiddleware, async (req, res) => {
  const receipt = await queryOne(
    'SELECT * FROM receipts WHERE order_id=$1 AND shop_id=$2',
    [req.params.orderId, req.shopId]
  )
  if (!receipt) return res.status(404).json({ error: 'ไม่พบใบเสร็จ' })
  res.json({ receipt })
})

router.post('/:orderId/send-line', authMiddleware, shopMiddleware, async (req, res) => {
  const receipt = await queryOne(
    'SELECT r.*, o.order_no, o.total, o.payment_method FROM receipts r JOIN orders o ON o.id=r.order_id WHERE r.order_id=$1 AND r.shop_id=$2',
    [req.params.orderId, req.shopId]
  )
  if (!receipt) return res.status(404).json({ error: 'ไม่พบใบเสร็จ' })

  const data = receipt.receipt_data
  const items = (data.items || []).map((i: any) => `• ${i.product_name} x${i.quantity} = ${Number(i.subtotal).toFixed(0)} บาท`).join('\n')

  const message: Message = {
    type: 'text',
    text: `🧾 ใบเสร็จ #${receipt.receipt_no}\n\n${data.shop?.shop_name || ''}\n${items}\n\nรวม: ${Number(receipt.total).toFixed(0)} บาท\nช่องทาง: ${receipt.payment_method}`,
  }

  try {
    await pushMessage(req.user!.line_user_id, [message])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'ส่งใบเสร็จไม่สำเร็จ' })
  }
})

export default router
