import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useC } from '../../context/AdminThemeContext'

const FIELDS = [
  { key: 'price', label: 'ราคา (บาท/เดือน)' },
  { key: 'max_products', label: 'สินค้าสูงสุด (-1 ไม่จำกัด)' },
  { key: 'max_orders_per_day', label: 'บิล/วัน (-1 ไม่จำกัด)' },
  { key: 'max_staff', label: 'พนักงาน (0 ไม่รองรับ, -1 ไม่จำกัด)' },
]
const TOGGLES = [
  { key: 'has_reports', label: 'รายงานยอดขาย' },
  { key: 'has_profit_report', label: 'รายงานกำไร' },
  { key: 'has_stock', label: 'จัดการสต็อก' },
  { key: 'has_daily_summary_line', label: 'สรุปยอดแจ้ง LINE' },
]

export default function AdminPlans() {
  const navigate = useNavigate()
  const c = useC()
  const [plans, setPlans] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/plans').then((r) => setPlans(r.data.plans)).catch(() => {
      toast.error('ไม่มีสิทธิ์')
      navigate('/admin/login')
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await api.put(`/admin/plans/${editing.id}`, editing)
      toast.success('บันทึกแล้ว')
      setPlans(plans.map((p) => p.id === editing.id ? editing : p))
      setEditing(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  const card = c('bg-zinc-800', 'bg-white border border-gray-100 shadow-sm') + ' rounded-2xl'
  const input = `w-full rounded-xl px-4 py-2.5 outline-none border ${c('bg-zinc-800 border-zinc-700 text-white', 'bg-gray-50 border-gray-200 text-gray-900')}`

  return (
    <AdminLayout title="แพ็คเกจ">
      <div className="space-y-3">
        {plans.map((p) => (
          <div key={p.id} className={`${card} p-5`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold text-lg">{p.name}</p>
                <p className="text-2xl font-bold text-green-500 mt-0.5">
                  {Number(p.price) === 0 ? 'ฟรี' : `${Number(p.price).toFixed(0)} ฿/เดือน`}
                </p>
              </div>
              <button onClick={() => setEditing({ ...p })} className={`text-sm px-4 py-2 rounded-xl ${c('bg-zinc-700 text-zinc-300 hover:bg-zinc-600', 'bg-gray-100 text-gray-700 hover:bg-gray-200')}`}>
                แก้ไข
              </button>
            </div>
            <div className={`text-sm border-t pt-3 space-y-1 ${c('border-zinc-700 text-zinc-400', 'border-gray-100 text-gray-500')}`}>
              <p>สินค้า {p.max_products === -1 ? '∞' : p.max_products} · บิล/วัน {p.max_orders_per_day === -1 ? '∞' : p.max_orders_per_day} · พนักงาน {p.max_staff === -1 ? '∞' : p.max_staff === 0 ? 'ไม่รองรับ' : p.max_staff}</p>
              <div className="flex flex-wrap gap-x-3 pt-1">
                {TOGGLES.map((t) => <span key={t.key} className={p[t.key] ? c('text-zinc-300', 'text-gray-700') : c('text-zinc-600 line-through', 'text-gray-300 line-through')}>{t.label}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className={`${c('bg-zinc-900 border border-zinc-700', 'bg-white border border-gray-100')} rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <h2 className="text-lg font-bold mb-5">แก้ไข {editing.name}</h2>
            <div className="space-y-3 mb-5">
              {FIELDS.map((f) => (
                <div key={f.key}>
                  <label className={`block text-xs font-semibold mb-1 ${c('text-zinc-400', 'text-gray-500')}`}>{f.label}</label>
                  <input type="number" value={editing[f.key]}
                    onChange={(e) => setEditing({ ...editing, [f.key]: Number(e.target.value) })}
                    className={input}
                  />
                </div>
              ))}
              <div className={`border-t pt-3 space-y-2 ${c('border-zinc-700', 'border-gray-100')}`}>
                {TOGGLES.map((t) => (
                  <label key={t.key} className="flex items-center gap-3 cursor-pointer py-1">
                    <input type="checkbox" checked={editing[t.key]}
                      onChange={(e) => setEditing({ ...editing, [t.key]: e.target.checked })}
                      className="w-5 h-5 accent-green-500"
                    />
                    <span className={c('text-zinc-300', 'text-gray-700')}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className={`flex-1 py-3 rounded-xl font-semibold ${c('bg-zinc-800 text-zinc-300', 'bg-gray-100 text-gray-600')}`}>ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                {saving ? 'บันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
