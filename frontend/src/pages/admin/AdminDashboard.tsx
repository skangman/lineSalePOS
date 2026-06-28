import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useC } from '../../context/AdminThemeContext'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const c = useC()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api.get('/admin/stats').then((r) => setStats(r.data)).catch(() => {
      toast.error('ไม่มีสิทธิ์เข้าถึง')
      navigate('/admin/login')
    })
  }, [])

  const fmt = (n: any) => Number(n || 0).toLocaleString('th-TH')
  const card = c('bg-zinc-800', 'bg-white border border-gray-100 shadow-sm') + ' rounded-2xl'
  const sub = c('text-zinc-400', 'text-gray-400')
  const muted = c('text-zinc-500', 'text-gray-400')
  const label = c('text-zinc-300', 'text-gray-600')

  const revenue7d: any[] = stats?.revenue7d || []
  const maxRevenue = Math.max(...revenue7d.map((d: any) => Number(d.revenue)), 1)

  return (
    <AdminLayout title="ภาพรวมระบบ">
      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'ร้านค้า', value: fmt(stats.shops?.total_shops), sub: `เปิด ${fmt(stats.shops?.active_shops)}` },
              { label: 'ผู้ใช้', value: fmt(stats.users?.total_users), sub: 'คน' },
              { label: 'บิลทั้งหมด', value: fmt(stats.orders?.total_orders), sub: 'บิล' },
              { label: 'ยอดขายรวม', value: fmt(stats.orders?.total_revenue), sub: 'บาท' },
            ].map((s) => (
              <div key={s.label} className={`${card} p-4`}>
                <p className={`text-xs mb-1 ${sub}`}>{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className={`text-xs mt-0.5 ${muted}`}>{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 mb-4">
            {revenue7d.length > 0 && (
              <div className={`${card} p-4`}>
                <p className={`text-sm font-semibold mb-4 ${label}`}>ยอดขาย 7 วันล่าสุด</p>
                <div className="flex items-end gap-1.5 h-24">
                  {revenue7d.map((d: any) => {
                    const h = Math.max((Number(d.revenue) / maxRevenue) * 100, 4)
                    const date = new Date(d.date)
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                        <p className={`text-xs leading-none truncate w-full text-center ${muted}`}>{fmt(d.revenue)}</p>
                        <div className="w-full bg-green-500 rounded-t" style={{ height: `${h}%` }} />
                        <p className={`text-xs ${muted}`}>{date.getDate()}/{date.getMonth()+1}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className={`${card} p-4`}>
              <p className={`text-sm font-semibold mb-3 ${label}`}>สัดส่วนแพ็คเกจ</p>
              <div className="space-y-3">
                {(stats.plan_dist || []).map((p: any) => {
                  const pct = stats.shops?.total_shops > 0 ? (p.shop_count / stats.shops.total_shops) * 100 : 0
                  const barColor = p.slug === 'pro' ? 'bg-green-500' : p.slug === 'premium' ? 'bg-yellow-500' : c('bg-zinc-500', 'bg-gray-400')
                  return (
                    <div key={p.slug}>
                      <div className={`flex justify-between text-sm mb-1`}>
                        <span className={label}>{p.name}</span>
                        <span className={muted}>{p.shop_count} ร้าน</span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${c('bg-zinc-700', 'bg-gray-100')}`}>
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {stats.pending_upgrades > 0 && (
            <button
              onClick={() => navigate('/admin/upgrades')}
              className="w-full bg-orange-500/20 border border-orange-500/30 rounded-2xl p-4 flex items-center gap-3 text-left"
            >
              <div className="flex-1">
                <p className="font-semibold text-orange-400">มีคำขออัปเกรด {stats.pending_upgrades} รายการ</p>
                <p className="text-xs text-orange-500/70 mt-0.5">กดเพื่อตรวจสอบ</p>
              </div>
              <span className="text-orange-400">→</span>
            </button>
          )}
        </>
      )}
    </AdminLayout>
  )
}
