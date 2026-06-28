import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getDailyReport, closeShop } from '../../api/client'
import { speak, buildVoiceText, DEFAULT_TEMPLATES } from '../../utils/voice'

export default function DailyReport() {
  const navigate = useNavigate()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)
  const [blocked, setBlocked] = useState(false)

  async function load(d: string) {
    setLoading(true)
    try {
      const result = await getDailyReport(d)
      setData(result)
    } catch (err: any) {
      if (err.status === 403) {
        setBlocked(true)
      } else {
        toast.error(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(date) }, [date])

  async function handleCloseShop() {
    if (!confirm('ปิดร้านและส่งสรุปยอดเข้า LINE ใช่ไหม?')) return
    setClosing(true)
    try {
      const result = await closeShop()
      const total = Number(result.summary?.total_sales ?? 0)
      speak(buildVoiceText(DEFAULT_TEMPLATES.close, { total_sales: total.toFixed(0) }))
      toast.success('ส่งสรุปยอดเข้า LINE แล้ว 🎉')
      await load(date)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setClosing(false)
    }
  }

  const fmt = (n: number) => Number(n || 0).toLocaleString('th-TH')
  const s = data?.summary

  if (blocked) return (
    <Layout title="ยอดขายรายวัน">
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <p className="text-lg font-bold text-gray-800 mb-2">ฟีเจอร์นี้ไม่รองรับในแพ็คเกจ Free</p>
        <p className="text-gray-500 text-sm mb-6">อัปเกรดเพื่อดูรายงานยอดขาย</p>
        <button onClick={() => navigate('/liff/plans')} className="bg-line-green text-white font-bold px-8 py-3 rounded-xl active:bg-line-dark">
          💎 ดูแพ็คเกจ
        </button>
      </div>
    </Layout>
  )

  return (
    <Layout title="ยอดขายรายวัน">
      <div className="px-4 py-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 mb-4 focus:border-line-green outline-none"
        />

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {/* Main stats */}
            <div className="bg-line-green text-white rounded-2xl p-5 mb-4 text-center">
              <p className="text-green-100 text-sm">ยอดขายรวม</p>
              <p className="text-4xl font-bold">{fmt(s?.total_sales)} ฿</p>
              <p className="text-green-100 text-sm mt-1">{s?.total_orders ?? 0} บิล</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: '💵 เงินสด', val: s?.cash_total, color: 'bg-green-50 text-green-700' },
                { label: '📱 โอน', val: s?.transfer_total, color: 'bg-blue-50 text-blue-700' },
                { label: '📲 QR', val: s?.promptpay_total, color: 'bg-purple-50 text-purple-700' },
                { label: '📝 ค้างจ่าย', val: s?.debt_total, color: 'bg-yellow-50 text-yellow-700' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`rounded-xl p-3 ${color}`}>
                  <p className="text-sm">{label}</p>
                  <p className="font-bold text-lg">{fmt(val)} ฿</p>
                </div>
              ))}
            </div>

            {/* Discount & Profit */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">ส่วนลดรวม</span>
                <span className="text-red-500">-{fmt(s?.total_discount)} ฿</span>
              </div>
              <div className="flex justify-between py-1 text-sm">
                <span className="text-gray-500">กำไรโดยประมาณ</span>
                <span className="text-green-600 font-bold">~{fmt(data?.estimated_profit)} ฿</span>
              </div>
            </div>

            {/* Top Products */}
            {data?.top_products?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <h3 className="font-bold text-gray-800 mb-3">🔥 สินค้าขายดี</h3>
                {data.top_products.map((p: any, i: number) => (
                  <div key={p.product_name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm w-5">{i + 1}.</span>
                      <span className="text-sm">{p.product_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-line-green font-semibold text-sm">{fmt(p.total)} ฿</span>
                      <span className="text-gray-400 text-xs block">x{p.qty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hourly */}
            {data?.hourly?.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <h3 className="font-bold text-gray-800 mb-3">📈 ยอดขายรายชั่วโมง</h3>
                {data.hourly.map((h: any) => (
                  <div key={h.hour} className="flex items-center gap-3 py-1.5">
                    <span className="text-gray-500 text-sm w-12">{String(h.hour).padStart(2, '0')}:00</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-line-green h-2 rounded-full"
                        style={{ width: `${Math.min(100, (Number(h.sales) / Number(s?.total_sales || 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">{fmt(h.sales)} ฿</span>
                  </div>
                ))}
              </div>
            )}

            {/* Close Shop */}
            {date === new Date().toISOString().split('T')[0] && (
              <button
                onClick={handleCloseShop}
                disabled={closing}
                className="w-full bg-gray-800 text-white font-bold text-lg py-4 rounded-2xl active:bg-gray-900 disabled:opacity-60 mb-4"
              >
                {closing ? 'กำลังปิดร้าน...' : '🏪 ปิดร้าน + ส่งสรุปยอด'}
              </button>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
