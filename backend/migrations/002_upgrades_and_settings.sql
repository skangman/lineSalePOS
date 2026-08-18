-- ตารางที่มีอยู่จริงใน local DB แล้ว (ถูกสร้างนอก migration มาก่อน) แต่ตกหล่นไม่ได้ใส่ไว้ใน 001_initial.sql
-- เพิ่มไว้ที่นี่เพื่อให้ DB ใหม่ (เช่น Aiven) ได้ schema ครบตรงกับที่โค้ดใช้งานจริง

-- ค่าตั้งค่าระบบแบบ key-value (global ไม่ผูกกับร้านไหน) — ใช้เก็บ promptpay_number สำหรับรับชำระอัปเกรดแพ็คเกจ
CREATE TABLE system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- คำขออัปเกรดแพ็คเกจของร้าน
CREATE TABLE upgrade_requests (
  id SERIAL PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  plan_id INT REFERENCES plans(id),
  amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending',
  note TEXT,
  slip_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
