import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { errorHandler, notFound } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.js'
import shopRoutes from './routes/shops.js'
import categoryRoutes from './routes/categories.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import reportRoutes from './routes/reports.js'
import stockRoutes from './routes/stock.js'
import receiptRoutes from './routes/receipts.js'
// import staffRoutes from './routes/staff.js' // ปิดใช้งานฟีเจอร์จัดการพนักงานชั่วคราว — ร้านเดี่ยวใช้แค่เจ้าของบัญชี ไม่ต้องเชิญพนักงาน
import settingsRoutes from './routes/settings.js'
import debtRoutes from './routes/debts.js'
import lineRoutes from './routes/line.js'
import adminRoutes from './routes/admin.js'
import uploadRoutes from './routes/uploads.js'
import upgradeRoutes from './routes/upgrades.js'

const app = express()
const PORT = process.env.PORT || 3100

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
// FRONTEND_URL รับได้หลายโดเมนคั่นด้วย , (เช่น production + preview)
const allowedOrigins = [
  'http://localhost:5174',
  ...(process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()),
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.trycloudflare.com') ||
      origin.endsWith('.vercel.app')
    ) {
      cb(null, true)
    } else {
      cb(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')))

// LINE webhook needs raw body
app.use('/api/line/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/shops', shopRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/stock', stockRoutes)
app.use('/api/receipts', receiptRoutes)
// app.use('/api/staff', staffRoutes) // ปิดใช้งานคู่กับ import ด้านบน
app.use('/api/settings', settingsRoutes)
app.use('/api/debts', debtRoutes)
app.use('/api/line', lineRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/upgrades', upgradeRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 LINE Sale POS API running on port ${PORT}`)
})
