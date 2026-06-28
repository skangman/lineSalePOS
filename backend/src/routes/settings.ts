import { Router } from 'express'
import { authMiddleware, shopMiddleware, requireRole } from '../middleware/auth.js'
import { query, queryOne } from '../config/db.js'

const router = Router()

router.get('/', authMiddleware, shopMiddleware, async (req, res) => {
  const settings = await queryOne('SELECT * FROM shop_settings WHERE shop_id=$1', [req.shopId])
  res.json({ settings })
})

router.put('/', authMiddleware, shopMiddleware, requireRole('owner'), async (req, res) => {
  const { voice_template_cash, voice_template_transfer, voice_template_promptpay, voice_template_debt, voice_template_close, low_stock_threshold } = req.body

  const settings = await queryOne(
    `INSERT INTO shop_settings (shop_id, voice_template_cash, voice_template_transfer, voice_template_promptpay, voice_template_debt, voice_template_close, low_stock_threshold)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (shop_id) DO UPDATE SET
       voice_template_cash=$2, voice_template_transfer=$3, voice_template_promptpay=$4,
       voice_template_debt=$5, voice_template_close=$6, low_stock_threshold=$7, updated_at=NOW()
     RETURNING *`,
    [req.shopId, voice_template_cash, voice_template_transfer, voice_template_promptpay, voice_template_debt, voice_template_close, low_stock_threshold]
  )
  res.json({ settings })
})

export default router
