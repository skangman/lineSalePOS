// ใช้ตอนรันเอง (local dev, หรือ host ที่ต้องมี process รันค้าง) — บน Vercel จะไม่ถูกเรียกไฟล์นี้เลย ดู api/index.ts แทน
import app from './app.js'

const PORT = process.env.PORT || 3100

app.listen(PORT, () => {
  console.log(`🚀 LINE Sale POS API running on port ${PORT}`)
})
