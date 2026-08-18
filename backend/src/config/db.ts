import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const rawUrl = process.env.DATABASE_URL || ''

// Aiven/managed Postgres ต้องต่อผ่าน SSL — local Docker Postgres ไม่ต้องใช้
const useSSL = process.env.NODE_ENV === 'production' || /sslmode=require/.test(rawUrl)

// pg เวอร์ชันใหม่ตีความ ?sslmode=require ที่ติดมากับ connection string เป็น verify-full
// (เช็ค CA เข้มงวด) ทำให้ต่อ Aiven ไม่ติดเพราะใช้ self-signed CA — ตัด query param ตัวนี้ออก
// แล้วคุม SSL ผ่าน object ssl ด้านล่างแทน (rejectUnauthorized: false = เข้ารหัสอย่างเดียว ไม่เช็ค CA)
const connectionString = rawUrl.replace(/([?&])sslmode=[^&]+&?/, '$1').replace(/[?&]$/, '')

export const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => {
  console.error('Unexpected DB error', err)
  process.exit(-1)
})

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params)
  return result.rows[0] as T ?? null
}
