// Entry point สำหรับ Vercel serverless — Vercel เรียกไฟล์ใน /api เป็น function
// Express app เป็น (req,res)=>{} อยู่แล้ว ส่งออกตรงๆ ให้ Vercel ใช้เป็น handler ได้เลย ไม่ต้องมี adapter
import app from '../src/app.js'

export default app
