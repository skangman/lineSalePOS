import { queryOne, query } from '../config/db.js'

export async function getShopPlan(shopId: string) {
  return queryOne(
    `SELECT p.* FROM plans p JOIN shops s ON s.plan_id = p.id WHERE s.id = $1`,
    [shopId]
  )
}

export async function checkProductLimit(shopId: string) {
  const plan = await getShopPlan(shopId)
  if (!plan || plan.max_products === -1) return
  const [{ count }] = await query(
    `SELECT COUNT(*) as count FROM products WHERE shop_id=$1 AND is_active=true`,
    [shopId]
  )
  if (Number(count) >= plan.max_products) {
    throw new Error(`แพ็คเกจ ${plan.name} สร้างสินค้าได้สูงสุด ${plan.max_products} รายการ\nอัปเกรดแพ็คเกจเพื่อเพิ่มสินค้าได้มากขึ้น`)
  }
}

export async function checkOrderLimit(shopId: string) {
  const plan = await getShopPlan(shopId)
  if (!plan || plan.max_orders_per_day === -1) return
  const today = new Date().toISOString().split('T')[0]
  const [{ count }] = await query(
    `SELECT COUNT(*) as count FROM orders WHERE shop_id=$1 AND DATE(created_at AT TIME ZONE 'Asia/Bangkok')=$2 AND payment_status != 'cancelled'`,
    [shopId, today]
  )
  if (Number(count) >= plan.max_orders_per_day) {
    throw new Error(`แพ็คเกจ ${plan.name} สร้างบิลได้สูงสุด ${plan.max_orders_per_day} บิล/วัน\nอัปเกรดแพ็คเกจเพื่อขายได้ไม่จำกัด`)
  }
}

export async function checkFeature(shopId: string, feature: 'has_stock' | 'has_reports' | 'has_profit_report' | 'has_daily_summary_line') {
  const plan = await getShopPlan(shopId)
  if (!plan || plan[feature]) return
  const label: Record<string, string> = {
    has_stock: 'จัดการสต็อก',
    has_reports: 'รายงานยอดขาย',
    has_profit_report: 'รายงานกำไร',
    has_daily_summary_line: 'สรุปยอดแจ้ง LINE',
  }
  throw new Error(`แพ็คเกจ ${plan.name} ไม่รองรับ${label[feature]}\nอัปเกรดแพ็คเกจเพื่อใช้งานฟีเจอร์นี้`)
}

export async function checkStaffLimit(shopId: string) {
  const plan = await getShopPlan(shopId)
  if (!plan || plan.max_staff === -1) return
  if (plan.max_staff === 0) {
    throw new Error(`แพ็คเกจ ${plan.name} ไม่รองรับการเพิ่มพนักงาน\nอัปเกรดเป็น Pro เพื่อเพิ่มพนักงานได้`)
  }
  const [{ count }] = await query(
    `SELECT COUNT(*) as count FROM shop_staff WHERE shop_id=$1 AND is_active=true AND role != 'owner'`,
    [shopId]
  )
  if (Number(count) >= plan.max_staff) {
    throw new Error(`แพ็คเกจ ${plan.name} เพิ่มพนักงานได้สูงสุด ${plan.max_staff} คน\nอัปเกรดแพ็คเกจเพื่อเพิ่มพนักงานได้มากขึ้น`)
  }
}
