import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import fs from 'fs'
import { authMiddleware, shopMiddleware } from '../middleware/auth.js'

const router = Router()

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')

// รับไฟล์เป็น buffer ก่อน แล้วค่อย compress + บันทึก
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // รับสูงสุด 10MB ก่อน compress
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('อัปโหลดได้เฉพาะไฟล์รูปภาพ'))
    }
  },
})

router.post('/image', authMiddleware, shopMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'กรุณาเลือกไฟล์รูปภาพ' })

  try {
    const filename = `${randomUUID()}.webp`
    const outputPath = path.join(UPLOAD_DIR, filename)

    // Resize ไม่เกิน 800x800 + แปลงเป็น webp คุณภาพ 80%
    await sharp(req.file.buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath)

    res.json({ url: `/uploads/${filename}` })
  } catch (err) {
    res.status(500).json({ error: 'บีบอัดรูปภาพไม่สำเร็จ' })
  }
})

export default router
