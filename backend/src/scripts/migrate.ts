// รัน migrations/*.sql ทั้งหมดเรียงตามชื่อไฟล์ ข้ามไฟล์ที่รันไปแล้ว (เก็บสถานะไว้ในตาราง schema_migrations)
// ใช้ตอนตั้ง DB ใหม่ (เช่น Aiven) — local dev ใช้ docker-entrypoint-initdb.d รันให้อัตโนมัติอยู่แล้วไม่ต้องรันซ้ำ
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { pool } from '../config/db.js'

const MIGRATIONS_DIR = path.join(process.cwd(), 'migrations')

async function main() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const { rows } = await pool.query('SELECT filename FROM schema_migrations')
  const applied = new Set(rows.map((r) => r.filename))

  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`⏭  ข้าม ${file} (รันไปแล้ว)`)
      continue
    }
    console.log(`▶️  รัน ${file} ...`)
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8')
    await pool.query(sql)
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
    console.log(`✅ เสร็จ ${file}`)
  }

  console.log('🎉 migrate ครบแล้ว')
  await pool.end()
}

main().catch((err) => {
  console.error('❌ migrate ล้มเหลว:', err.message)
  process.exit(1)
})
