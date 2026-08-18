import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import AdminLayout from '../../components/AdminLayout'
import { useAdminTheme, useC } from '../../context/AdminThemeContext'

export default function AdminSettings() {
  const navigate = useNavigate()
  const { theme, setTheme } = useAdminTheme()
  const c = useC()
  const [promptpay, setPromptpay] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/settings').then((r) => {
      setPromptpay(r.data.settings.promptpay_number || '')
    }).catch(() => { navigate('/admin/login') })
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await api.put('/admin/settings', { promptpay_number: promptpay })
      toast.success('บันทึกแล้ว')
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  function logout() {
    if (!confirm('ออกจากระบบ?')) return
    localStorage.removeItem('line_user_id')
    navigate('/admin/login')
  }

  const card = c('bg-zinc-800', 'bg-white border border-gray-100 shadow-sm') + ' rounded-2xl'

  return (
    <AdminLayout title="ตั้งค่า">
      <div className="space-y-3 max-w-md mx-auto">

        {/* Theme */}
        <div className={`${card} p-5`}>
          <p className={`text-sm font-semibold mb-4 ${c('text-zinc-300', 'text-gray-700')}`}>ธีม</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                theme === 'light'
                  ? 'bg-gray-900 text-white'
                  : c('bg-zinc-700 text-zinc-400', 'bg-gray-100 text-gray-400')
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`py-3 rounded-xl font-semibold text-sm transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-700 text-white ring-2 ring-zinc-500'
                  : c('bg-zinc-700 text-zinc-400', 'bg-gray-100 text-gray-400')
              }`}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        {/* PromptPay */}
        <div className={`${card} p-5`}>
          <p className={`text-sm font-semibold mb-1 ${c('text-zinc-300', 'text-gray-700')}`}>เลขพร้อมเพย์รับชำระ</p>
          <p className={`text-xs mb-3 ${c('text-zinc-500', 'text-gray-400')}`}>ใช้สำหรับแสดง QR ให้ลูกค้าสแกนจ่ายค่าอัปเกรด</p>
          <input
            type="text" value={promptpay}
            onChange={(e) => setPromptpay(e.target.value)}
            placeholder="0812345678"
            className={`w-full rounded-xl px-4 py-3 outline-none border mb-3 ${c('bg-zinc-700 border-zinc-600 text-white placeholder-zinc-500', 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-300')}`}
          />
          <button onClick={handleSave} disabled={saving} className="w-full bg-green-500 text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {saving ? 'บันทึก...' : 'บันทึก'}
          </button>
        </div>

        {/* Logout */}
        <div className={`${card} p-5`}>
          <p className={`text-sm font-semibold mb-1 ${c('text-zinc-300', 'text-gray-700')}`}>บัญชีผู้ดูแลระบบ</p>
          <p className={`text-xs mb-3 ${c('text-zinc-500', 'text-gray-400')}`}>ออกจากระบบ Admin Panel</p>
          <button onClick={logout} className="w-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl">
            ออกจากระบบ
          </button>
        </div>

      </div>
    </AdminLayout>
  )
}
