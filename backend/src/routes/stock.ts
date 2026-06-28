import { Router } from 'express'
import { authMiddleware, shopMiddleware, requireRole } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'
import { checkFeature } from '../utils/planLimits.js'

const router = Router()

// block ทุก stock endpoint ถ้าแพ็คเกจไม่รองรับ
router.use(authMiddleware, shopMiddleware, async (req, res, next) => {
  try { await checkFeature(req.shopId!, 'has_stock'); next() }
  catch (err: any) { res.status(403).json({ error: err.message }) }
})

router.get('/', async (req, res) => {
  const rows = await query(
    `SELECT p.*, c.name as category_name,
            CASE WHEN p.stock_quantity <= 5 AND NOT p.is_unlimited_stock THEN true ELSE false END as low_stock
     FROM products p LEFT JOIN categories c ON c.id=p.category_id
     WHERE p.shop_id=$1 AND p.is_active=true
     ORDER BY p.product_name`,
    [req.shopId]
  )
  res.json({ stock: rows })
})

router.post('/restock', requireRole('owner', 'manager'), async (req, res) => {
  const { product_id, quantity, note } = req.body
  if (!product_id || !quantity) return res.status(400).json({ error: 'กรุณาระบุสินค้าและจำนวน' })

  const product = await queryOne('SELECT * FROM products WHERE id=$1 AND shop_id=$2', [product_id, req.shopId])
  if (!product) return res.status(404).json({ error: 'ไม่พบสินค้า' })

  const before = product.stock_quantity
  const after = before + Number(quantity)

  await query('UPDATE products SET stock_quantity=$1, updated_at=NOW() WHERE id=$2', [after, product_id])
  await query(
    `INSERT INTO stock_movements (shop_id, product_id, movement_type, quantity, quantity_before, quantity_after, note, created_by)
     VALUES ($1,$2,'restock',$3,$4,$5,$6,$7)`,
    [req.shopId, product_id, quantity, before, after, note || null, req.user!.id]
  )

  res.json({ success: true, stock_quantity: after })
})

router.post('/adjust', requireRole('owner', 'manager'), async (req, res) => {
  const { product_id, quantity, note } = req.body
  if (!product_id || quantity == null) return res.status(400).json({ error: 'กรุณาระบุสินค้าและจำนวน' })

  const product = await queryOne('SELECT * FROM products WHERE id=$1 AND shop_id=$2', [product_id, req.shopId])
  if (!product) return res.status(404).json({ error: 'ไม่พบสินค้า' })

  const before = product.stock_quantity
  await query('UPDATE products SET stock_quantity=$1, updated_at=NOW() WHERE id=$2', [quantity, product_id])
  await query(
    `INSERT INTO stock_movements (shop_id, product_id, movement_type, quantity, quantity_before, quantity_after, note, created_by)
     VALUES ($1,$2,'adjustment',$3,$4,$5,$6,$7)`,
    [req.shopId, product_id, Number(quantity) - before, before, Number(quantity), note || null, req.user!.id]
  )

  res.json({ success: true, stock_quantity: Number(quantity) })
})

router.get('/movements', async (req, res) => {
  const { product_id, limit = 50 } = req.query
  let sql = `SELECT sm.*, p.product_name FROM stock_movements sm
             JOIN products p ON p.id=sm.product_id
             WHERE sm.shop_id=$1`
  const params: any[] = [req.shopId]
  if (product_id) { params.push(product_id); sql += ` AND sm.product_id=$${params.length}` }
  sql += ` ORDER BY sm.created_at DESC LIMIT $${params.length + 1}`
  params.push(limit)

  const rows = await query(sql, params)
  res.json({ movements: rows })
})

export default router
