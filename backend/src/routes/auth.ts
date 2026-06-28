import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { queryOne } from '../config/db.js'

const router = Router()

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const staff = await queryOne(
      `SELECT ss.shop_id, ss.role, s.shop_name, s.logo_url, s.is_active as shop_active,
              s.plan_id, p.slug as plan_slug
       FROM shop_staff ss
       JOIN shops s ON s.id = ss.shop_id
       JOIN plans p ON p.id = s.plan_id
       WHERE ss.user_id = $1 AND ss.is_active = true
       LIMIT 1`,
      [req.user!.id]
    )

    res.json({
      user: req.user,
      shop: staff
        ? {
            shop_id: staff.shop_id,
            role: staff.role,
            shop_name: staff.shop_name,
            logo_url: staff.logo_url,
            plan_slug: staff.plan_slug,
          }
        : null,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
