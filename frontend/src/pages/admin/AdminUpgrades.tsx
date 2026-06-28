import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useC } from '../../context/AdminThemeContext'

export default function AdminUpgrades() {
  const navigate = useNavigate()
  const c = useC()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const { data } = await api.get('/admin/upgrades')
      setRequests(data.requests)
    } catch (err: any) {
      toast.error(err.message)
      navigate('/admin/login')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleApprove(id: number, shopName: string, planName: string) {
    if (!confirm(`อนุมัติ "${shopName}" → ${planName}?`)) return
    try {
      await api.patch(`/admin/upgrades/${id}/approve`, {})
      toast.success('อนุมัติแล้ว')
      await load()
    } catch (err: any) { toast.error(err.message) }
  }

  async function handleReject(id: number) {
    if (!confirm('ปฏิเสธคำขอนี้?')) return
    try {
      await api.patch(`/admin/upgrades/${id}/reject`, {})
      toast.success('ปฏิเสธแล้ว')
      await load()
    } catch (err: any) { toast.error(err.message) }
  }

  const card = c('bg-zinc-800', 'bg-white border border-gray-100 shadow-sm') + ' rounded-2xl'

  return (
    <AdminLayout title="คำขออัปเกรด">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <p className={`text-3xl mb-2 ${c('text-zinc-500', 'text-gray-300')}`}>✓</p>
          <p className={`font-semibold ${c('text-zinc-300', 'text-gray-700')}`}>ไม่มีคำขอที่รออนุมัติ</p>
          <p className={`text-sm mt-1 ${c('text-zinc-500', 'text-gray-400')}`}>คำขอใหม่จะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className={`${card} p-5`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold">{r.shop_name}</p>
                  <p className={`text-sm mt-0.5 ${c('text-zinc-400', 'text-gray-500')}`}>
                    ขอเปลี่ยนเป็น <span className="text-green-400 font-semibold">{r.plan_name}</span>
                    {' · '}{Number(r.plan_price).toLocaleString('th-TH')} บาท/เดือน
                  </p>
                  <p className={`text-xs mt-1 ${c('text-zinc-600', 'text-gray-400')}`}>
                    {new Date(r.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full font-medium whitespace-nowrap">รอตรวจ</span>
              </div>

              {r.slip_url ? (
                <a href={r.slip_url} target="_blank" rel="noreferrer" className="block mb-4">
                  <div className={`rounded-xl overflow-hidden border ${c('bg-zinc-700 border-zinc-600', 'bg-gray-50 border-gray-100')}`}>
                    <img src={r.slip_url} alt="สลิป" className="w-full max-h-52 object-contain" />
                  </div>
                  <p className={`text-xs text-center mt-1 ${c('text-zinc-500', 'text-gray-400')}`}>กดเพื่อดูขนาดเต็ม</p>
                </a>
              ) : (
                <div className={`mb-4 border-2 border-dashed rounded-xl p-4 text-center text-sm ${c('border-zinc-600 text-zinc-500', 'border-gray-200 text-gray-400')}`}>
                  ไม่มีสลิปแนบมา
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => handleReject(r.id)} className={`flex-1 font-semibold py-3 rounded-xl ${c('bg-zinc-700 text-zinc-300 hover:bg-zinc-600', 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                  ปฏิเสธ
                </button>
                <button onClick={() => handleApprove(r.id, r.shop_name, r.plan_name)} className="flex-[2] bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-400">
                  อนุมัติ — {r.plan_name}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
