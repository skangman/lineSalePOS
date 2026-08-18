import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

// Aiven/managed Postgres ต้องต่อผ่าน SSL — local Docker Postgres ไม่ต้องใช้
const useSSL = process.env.NODE_ENV === 'production' || /sslmode=require/.test(process.env.DATABASE_URL || '')

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
