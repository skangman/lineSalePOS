import type { Request, Response, NextFunction } from 'express'
import { query, queryOne } from '../config/db.js'
import type { User } from '../types/index.js'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const lineUserId = req.headers['x-line-userid'] as string

  if (!lineUserId) {
    return res.status(401).json({ error: 'Unauthorized: LINE userId required' })
  }

  try {
    let user = await queryOne<User>(
      'SELECT * FROM users WHERE line_user_id = $1',
      [lineUserId]
    )

    if (!user) {
      const displayName = req.headers['x-line-displayname'] as string || 'Unknown'
      const pictureUrl = req.headers['x-line-pictureurl'] as string || ''
      const rows = await query<User>(
        `INSERT INTO users (line_user_id, display_name, picture_url)
         VALUES ($1, $2, $3)
         ON CONFLICT (line_user_id) DO UPDATE
           SET display_name = EXCLUDED.display_name, picture_url = EXCLUDED.picture_url, updated_at = NOW()
         RETURNING *`,
        [lineUserId, displayName, pictureUrl]
      )
      user = rows[0]
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Auth error:', err)
    res.status(500).json({ error: 'Authentication error' })
  }
}

export async function shopMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const staff = await queryOne<{ shop_id: string; role: string }>(
      `SELECT ss.shop_id, ss.role FROM shop_staff ss
       JOIN shops s ON s.id = ss.shop_id
       WHERE ss.user_id = $1 AND ss.is_active = true AND s.is_active = true
       LIMIT 1`,
      [req.user.id]
    )

    if (!staff) {
      return res.status(403).json({ error: 'ไม่พบร้านค้าของคุณ กรุณาสมัครร้านค้าก่อน' })
    }

    req.shopId = staff.shop_id
    req.staffRole = staff.role
    next()
  } catch (err) {
    console.error('Shop middleware error:', err)
    res.status(500).json({ error: 'Server error' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staffRole || !roles.includes(req.staffRole)) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์ดำเนินการนี้' })
    }
    next()
  }
}

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
