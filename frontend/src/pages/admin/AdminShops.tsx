import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useC } from '../../context/AdminThemeContext'

export default function AdminShops() {
  const navigate = useNavigate()
  const c = useC()
  const [shops, setShops] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const [s, p] = await Promise.all([
        api.get('/admin/shops', { params: { search } }),
        api.get('/admin/plans'),
      ])
      setShops(s.data.shops)
      setPlans(p.data.plans)
    } catch {
      toast.error('ไม่มีสิทธิ์เข้าถึง')
      navigate('/admin/login')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search])

  async function toggleShop(id: string, current: boolean) {
    try {
      await api.patch(`/admin/shops/${id}/status`, { is_active: !current })
      toast.success(!current ? 'เปิดร้านแล้ว' : 'ปิดร้านแล้ว')
      await load()
    } catch (err: any) { toast.error(err.message) }
  }

  async function changePlan(shopId: string, planId: number, planName: string) {
    try {
      await api.patch(`/admin/shops/${shopId}/plan`, { plan_id: planId })
      toast.success(`เปลี่ยนเป็น ${planName} แล้ว`)
      setShops(shops.map((s) => s.id === shopId ? { ...s, plan_id: planId, plan_name: planName } : s))
    } catch (err: any) { toast.error(err.message) }
  }

  const card = c('bg-zinc-800', 'bg-white border border-gray-100 shadow-sm') + ' rounded-2xl'

  return (
    <AdminLayout title="ร้านค้า">
      <input
        type="text" value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ค้นหาชื่อร้าน..."
        className={`w-full rounded-xl px-4 py-3 mb-4 outline-none ${c('bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-500', 'bg-white border border-gray-200 text-gray-900 placeholder-gray-300 focus:border-gray-400')}`}
      />

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : shops.length === 0 ? (
        <div className={`text-center py-16 ${c('text-zinc-500', 'text-gray-400')}`}>ไม่พบร้านค้า</div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <div key={shop.id} className={`${card} p-4 ${!shop.is_active ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold">{shop.shop_name}</p>
                  <p className={`text-sm ${c('text-zinc-400', 'text-gray-500')}`}>{shop.owner_display}</p>
                  <p className={`text-xs mt-0.5 ${c('text-zinc-600', 'text-gray-400')}`}>
                    {Number(shop.total_orders).toLocaleString()} บิลทั้งหมด
                  </p>
                </div>
                <button
                  onClick={() => toggleShop(shop.id, shop.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${shop.is_active ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                >
                  {shop.is_active ? 'ปิด' : 'เปิด'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  shop.plan_name === 'Pro' ? 'bg-green-500/20 text-green-400' :
                  shop.plan_name === 'Premium' ? 'bg-yellow-500/20 text-yellow-400' :
                  c('bg-zinc-700 text-zinc-300', 'bg-gray-100 text-gray-600')
                }`}>
                  {shop.plan_name}
                </span>
                <select
                  value={shop.plan_id}
                  onChange={(e) => {
                    const p = plans.find((pl) => pl.id === Number(e.target.value))
                    if (p) changePlan(shop.id, p.id, p.name)
                  }}
                  className={`text-xs rounded-lg px-2 py-1.5 outline-none border ${c('bg-zinc-700 border-zinc-600 text-zinc-300', 'bg-white border-gray-200 text-gray-700')}`}
                >
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
