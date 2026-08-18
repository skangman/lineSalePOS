import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getMe, getDashboard } from '../../api/client'
import BottomNav from '../../components/BottomNav'
import type { DashboardSummary } from '../../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [shopName, setShopName] = useState('')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasShop, setHasShop] = useState<boolean | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { shop } = await getMe()
        if (!shop) { setHasShop(false); setLoading(false); navigate('/liff/register', { replace: true }); return }
        setHasShop(true)
        setShopName(shop.shop_name)

        const data = await getDashboard()
        setSummary(data.summary)
        setTopProducts(data.top_products)
      } catch (err: any) {
        if (err.message?.includes('ไม่พบร้านค้า') || err.message?.includes('สมัครร้าน')) {
          setHasShop(false)
          navigate('/liff/register', { replace: true })
        } else {
          toast.error(err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-line-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (hasShop === false) {
    // เด้งไปฟอร์มสมัครร้านทันที (ดู navigate('/liff/register') ด้านบน) — โชว์แค่ spinner ระหว่างรอเปลี่ยนหน้า
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-line-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  const fmt = (n: number) => Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0 })

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 md:pb-0 md:ml-20">
      {/* Header */}
      <div className="bg-line-green text-white px-4 pt-4 pb-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-100 text-sm">ยินดีต้อนรับ</p>
          <h1 className="text-xl font-bold">{shopName}</h1>
          <p className="text-green-100 text-sm">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="px-4 -mt-3 max-w-5xl mx-auto w-full">
        {/* Sales Summary Card */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
          <p className="text-gray-500 text-sm mb-1">ยอดขายวันนี้</p>
          <p className="text-3xl font-bold text-line-green">{fmt(summary?.total_sales ?? 0)} ฿</p>
          <p className="text-gray-400 text-sm">{summary?.total_orders ?? 0} บิล</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">💵 เงินสด</p>
              <p className="font-bold text-green-700">{fmt(summary?.cash_total ?? 0)} ฿</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">📱 โอน/QR</p>
              <p className="font-bold text-blue-700">{fmt(Number(summary?.transfer_total ?? 0) + Number(summary?.promptpay_total ?? 0))} ฿</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 cursor-pointer active:bg-yellow-100" onClick={() => navigate('/liff/debts')}>
              <p className="text-xs text-gray-500">📝 ค้างจ่าย</p>
              <p className="font-bold text-yellow-700">{fmt(summary?.debt_total ?? 0)} ฿</p>
              <p className="text-xs text-yellow-500 mt-0.5">กดเพื่อจัดการ →</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">📦 บิลทั้งหมด</p>
              <p className="font-bold text-purple-700">{summary?.total_orders ?? 0} บิล</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button onClick={() => navigate('/liff/pos')} className="bg-line-green text-white rounded-2xl p-4 text-center shadow-md active:bg-line-dark hover:bg-line-dark transition-colors">
            <span className="text-3xl block mb-1">🛒</span>
            <span className="font-bold text-lg">เปิด POS</span>
            <span className="text-green-100 text-xs block">เริ่มขายสินค้า</span>
          </button>
          <button onClick={() => navigate('/liff/products/add')} className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100 active:bg-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-3xl block mb-1">➕</span>
            <span className="font-bold text-lg text-gray-800">เพิ่มสินค้า</span>
            <span className="text-gray-400 text-xs block">จัดการสินค้า</span>
          </button>
          <button onClick={() => navigate('/liff/orders')} className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100 active:bg-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-3xl block mb-1">📋</span>
            <span className="font-bold text-lg text-gray-800">ประวัติขาย</span>
            <span className="text-gray-400 text-xs block">ดูบิลทั้งหมด</span>
          </button>
          <button onClick={() => navigate('/liff/reports/daily')} className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100 active:bg-gray-50 hover:bg-gray-50 transition-colors">
            <span className="text-3xl block mb-1">📊</span>
            <span className="font-bold text-lg text-gray-800">ยอดขาย</span>
            <span className="text-gray-400 text-xs block">สรุปรายวัน</span>
          </button>
        </div>

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md p-4 mb-4">
            <h2 className="font-bold text-gray-800 mb-3">🔥 สินค้าขายดีวันนี้</h2>
            <div className={topProducts.length > 1 ? 'md:grid md:grid-cols-2 md:gap-x-6' : ''}>
              {topProducts.map((p, i) => (
                <div key={p.product_name} className="flex items-center justify-between py-2 border-b last:border-0 md:last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm w-5">{i + 1}.</span>
                    <span className="text-gray-800">{p.product_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-line-green font-semibold">{fmt(p.total)} ฿</span>
                    <span className="text-gray-400 text-xs block">x{p.qty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Nav */}
      <BottomNav />
    </div>
  )
}
