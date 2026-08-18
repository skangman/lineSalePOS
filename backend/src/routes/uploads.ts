import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import fs from 'fs'
import { put } from '@vercel/blob'
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

    // รูปสินค้าในแอปแสดงใหญ่สุดแค่ ~192px (ฟอร์มเพิ่มสินค้า) — 640px ก็เกินพอสำหรับจอ retina 2x แล้ว
    // ไฟล์เล็กลง ~35% จากเดิม (800px) โดยที่ยังคมสมเหตุผลสำหรับขนาดที่แสดงจริง
    // sharpen ช่วยชดเชยความฟุ้ง (blur) ที่เกิดจากการบีบอัด webp คุณภาพต่ำลง
    const buffer = await sharp(req.file.buffer)
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .sharpen({ sigma: 0.6 })
      .webp({ quality: 75 })
      .toBuffer()

    // บน Vercel filesystem เป็น read-only/ชั่วคราว เก็บรูปจริงไว้ไม่ได้ — ใช้ Vercel Blob แทน
    // (ตั้ง BLOB_READ_WRITE_TOKEN ผ่านการเชื่อม Blob store เข้ากับ Vercel project)
    // รันบนเครื่อง/host ที่มี disk จริง (ไม่มี token นี้) จะ fallback ไปเขียนไฟล์ในเครื่องเหมือนเดิม
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, buffer, { access: 'public', contentType: 'image/webp' })
      return res.json({ url: blob.url })
    }

    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer)
    res.json({ url: `/uploads/${filename}` })
  } catch (err) {
    res.status(500).json({ error: 'บีบอัดรูปภาพไม่สำเร็จ' })
  }
})

export default router
