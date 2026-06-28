import { Router } from 'express'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'

const router = Router()

router.get('/', authMiddleware, shopMiddleware, async (req, res) => {
  const rows = await query(
    'SELECT * FROM categories WHERE shop_id=$1 AND is_active=true ORDER BY sort_order, name',
    [req.shopId]
  )
  res.json({ categories: rows })
})

router.post('/', authMiddleware, shopMiddleware, async (req, res) => {
  const { name, sort_order = 0 } = req.body
  if (!name) return res.status(400).json({ error: 'กรุณากรอกชื่อหมวดหมู่' })

  const [cat] = await query(
    'INSERT INTO categories (shop_id, name, sort_order) VALUES ($1,$2,$3) RETURNING *',
    [req.shopId, name, sort_order]
  )
  res.status(201).json({ category: cat })
})

router.put('/:id', authMiddleware, shopMiddleware, async (req, res) => {
  const { name, sort_order } = req.body
  const cat = await queryOne(
    'UPDATE categories SET name=$1, sort_order=$2 WHERE id=$3 AND shop_id=$4 RETURNING *',
    [name, sort_order, req.params.id, req.shopId]
  )
  if (!cat) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' })
  res.json({ category: cat })
})

router.delete('/:id', authMiddleware, shopMiddleware, async (req, res) => {
  await query(
    'UPDATE categories SET is_active=false WHERE id=$1 AND shop_id=$2',
    [req.params.id, req.shopId]
  )
  res.json({ success: true })
})

export default router
