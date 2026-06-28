import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { query, queryOne, pool } from '../config/db.js'
import { pushMessage, buildSaleMessage, buildCancelMessage } from '../services/lineService.js'
import { checkOrderLimit } from '../utils/planLimits.js'

const router = Router()

router.post('/', authMiddleware, shopMiddleware, async (req, res) => {
  const { items, discount = 0, payment_method, cash_received, customer_name, customer_phone, note } = req.body
  const shopId = req.shopId!
  const userId = req.user!.id
  const lineUserId = req.user!.line_user_id

  if (!items?.length) return res.status(400).json({ error: 'กรุณาเลือกสินค้า' })
  if (!payment_method) return res.status(400).json({ error: 'กรุณาเลือกวิธีชำระเงิน' })

  try { await checkOrderLimit(shopId) } catch (err: any) {
    return res.status(403).json({ error: err.message })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Get shop info for tax/service
    const { rows: [shop] } = await client.query('SELECT * FROM shops WHERE id=$1', [shopId])
    if (!shop) throw new Error('Shop not found')

    // Validate and fetch products
    const productIds = items.map((i: any) => i.product_id)
    const { rows: products } = await client.query(
      `SELECT * FROM products WHERE id = ANY($1) AND shop_id=$2 AND is_active=true`,
      [productIds, shopId]
    )
    const productMap = new Map(products.map((p: any) => [p.id, p]))

    let subtotal = 0
    const orderItems: any[] = []

    for (const item of items) {
      const product = productMap.get(item.product_id)
      if (!product) throw new Error(`ไม่พบสินค้า: ${item.product_id}`)
      if (!product.is_unlimited_stock && product.stock_quantity < item.quantity) {
        throw new Error(`สินค้า "${product.product_name}" มีไม่พอ (เหลือ ${product.stock_quantity})`)
      }
      const itemSubtotal = product.price * item.quantity
      subtotal += itemSubtotal
      orderItems.push({ product, quantity: item.quantity, subtotal: itemSubtotal })
    }

    const taxAmount = Math.round(subtotal * (shop.tax_rate / 100) * 100) / 100
    const serviceCharge = Math.round(subtotal * (shop.service_charge_rate / 100) * 100) / 100
    const total = subtotal - discount + taxAmount + serviceCharge
    const changeAmount = payment_method === 'cash' && cash_received ? cash_received - total : 0

    // Lock per shop+date — ทั้ง lock และ MAX ต้องอยู่บน client เดียวกัน
    const today = new Date().toISOString().split('T')[0]
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1 || $2))`, [shopId, today])
    const { rows: [{ order_no }] } = await client.query(
      `SELECT 'ORD-' || TO_CHAR($2::DATE, 'YYYYMMDD') || '-' ||
        LPAD((COALESCE(MAX(SUBSTRING(order_no FROM '[0-9]+$')::INT), 0) + 1)::TEXT, 4, '0') AS order_no
       FROM orders WHERE shop_id = $1 AND DATE(created_at) = $2::DATE`,
      [shopId, today]
    )

    let customerId = null
    if (payment_method === 'debt' && customer_name) {
      const { rows: [existingCustomer] } = await client.query(
        'SELECT id FROM customers WHERE shop_id=$1 AND name=$2',
        [shopId, customer_name]
      )
      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { rows: [c] } = await client.query(
          'INSERT INTO customers (shop_id, name, phone) VALUES ($1,$2,$3) RETURNING id',
          [shopId, customer_name, customer_phone || null]
        )
        customerId = c.id
      }
    }

    const { rows: [order] } = await client.query(
      `INSERT INTO orders
        (shop_id, user_id, order_no, subtotal, discount, tax_amount, service_charge, total,
         payment_method, payment_status, cash_received, change_amount, customer_id, customer_name, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [shopId, userId, order_no, subtotal, discount, taxAmount, serviceCharge, total,
       payment_method, payment_method === 'debt' ? 'unpaid' : 'paid',
       cash_received || null, changeAmount || null, customerId, customer_name || null, note || null]
    )

    for (const { product, quantity, subtotal: itemSub } of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, cost_price, quantity, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, product.id, product.product_name, product.price, product.cost_price, quantity, itemSub]
      )

      if (!product.is_unlimited_stock) {
        const { rows: [{ stock_quantity: before }] } = await client.query(
          'UPDATE products SET stock_quantity=stock_quantity-$1, updated_at=NOW() WHERE id=$2 RETURNING stock_quantity',
          [quantity, product.id]
        )
        await client.query(
          `INSERT INTO stock_movements (shop_id, product_id, order_id, movement_type, quantity, quantity_before, quantity_after, created_by)
           VALUES ($1,$2,$3,'sale',$4,$5,$6,$7)`,
          [shopId, product.id, order.id, -quantity, before + quantity, before, userId]
        )
      }
    }

    // Receipt
    const receiptData = { order, items: orderItems.map(({ product, quantity, subtotal }) => ({ product_name: product.product_name, quantity, subtotal, price: product.price })), shop }
    const receiptNo = order_no.replace('ORD-', 'RCP-')
    await client.query(
      'INSERT INTO receipts (order_id, shop_id, receipt_no, receipt_data) VALUES ($1,$2,$3,$4)',
      [order.id, shopId, receiptNo, JSON.stringify(receiptData)]
    )

    if (payment_method === 'debt' && customerId) {
      await client.query(
        'INSERT INTO debts (shop_id, order_id, customer_id, customer_name, amount) VALUES ($1,$2,$3,$4,$5)',
        [shopId, order.id, customerId, customer_name, total]
      )
    }

    await client.query('COMMIT')

    // LINE notification (non-blocking)
    if (shop.line_notify_enabled) {
      const itemsForMsg = orderItems.map(({ product, quantity, subtotal }) => ({
        product_name: product.product_name,
        quantity,
        subtotal,
      }))
      pushMessage(lineUserId, [buildSaleMessage({ orderNo: order_no, total, paymentMethod: payment_method, items: itemsForMsg, cashReceived: cash_received, changeAmount, customerName: customer_name })]).catch(() => {})
    }

    res.status(201).json({ order, receipt_no: receiptNo })
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('Order error:', err)
    res.status(400).json({ error: err.message || 'เกิดข้อผิดพลาด' })
  } finally {
    client.release()
  }
})

router.get('/', authMiddleware, shopMiddleware, async (req, res) => {
  const { date, payment_method, payment_status, limit = 50, offset = 0 } = req.query
  let sql = `SELECT o.*, COUNT(oi.id) as item_count
             FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
             WHERE o.shop_id=$1`
  const params: any[] = [req.shopId]

  if (date) { params.push(date); sql += ` AND DATE(o.created_at AT TIME ZONE 'Asia/Bangkok')=$${params.length}` }
  if (payment_method) { params.push(payment_method); sql += ` AND o.payment_method=$${params.length}` }
  if (payment_status) { params.push(payment_status); sql += ` AND o.payment_status=$${params.length}` }

  sql += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, offset)

  const rows = await query(sql, params)
  res.json({ orders: rows })
})

router.get('/:id', authMiddleware, shopMiddleware, async (req, res) => {
  const order = await queryOne('SELECT * FROM orders WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId])
  if (!order) return res.status(404).json({ error: 'ไม่พบออเดอร์' })
  const items = await query('SELECT * FROM order_items WHERE order_id=$1', [req.params.id])
  res.json({ order, items })
})

router.post('/:id/cancel', authMiddleware, shopMiddleware, async (req, res) => {
  const { cancel_reason } = req.body
  if (!cancel_reason) return res.status(400).json({ error: 'กรุณาระบุเหตุผล' })

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const order = await queryOne('SELECT * FROM orders WHERE id=$1 AND shop_id=$2', [req.params.id, req.shopId])
    if (!order) throw new Error('ไม่พบออเดอร์')
    if (order.payment_status === 'cancelled') throw new Error('ออเดอร์นี้ถูกยกเลิกแล้ว')

    await client.query(
      `UPDATE orders SET payment_status='cancelled', cancel_reason=$1, cancelled_at=NOW(), cancelled_by=$2, updated_at=NOW()
       WHERE id=$3`,
      [cancel_reason, req.user!.id, order.id]
    )

    // Return stock
    const items = await query('SELECT * FROM order_items WHERE order_id=$1', [order.id])
    for (const item of items) {
      const product = await queryOne('SELECT * FROM products WHERE id=$1', [item.product_id])
      if (product && !product.is_unlimited_stock) {
        const { rows: [{ stock_quantity: after }] } = await client.query(
          'UPDATE products SET stock_quantity=stock_quantity+$1 WHERE id=$2 RETURNING stock_quantity',
          [item.quantity, item.product_id]
        )
        await client.query(
          `INSERT INTO stock_movements (shop_id, product_id, order_id, movement_type, quantity, quantity_before, quantity_after, created_by, note)
           VALUES ($1,$2,$3,'cancel_return',$4,$5,$6,$7,$8)`,
          [req.shopId, item.product_id, order.id, item.quantity, after - item.quantity, after, req.user!.id, cancel_reason]
        )
      }
    }

    await client.query('COMMIT')

    // Notify LINE
    const shop = await queryOne('SELECT * FROM shops WHERE id=$1', [req.shopId])
    if (shop?.line_notify_enabled) {
      pushMessage(req.user!.line_user_id, [buildCancelMessage({ orderNo: order.order_no, total: order.total, reason: cancel_reason })]).catch(() => {})
    }

    res.json({ success: true })
  } catch (err: any) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

export default router
