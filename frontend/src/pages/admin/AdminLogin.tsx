import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [lineUserId, setLineUserId] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!lineUserId) return toast.error('กรุณากรอก LINE User ID')
    setLoading(true)

    try {
      localStorage.setItem('line_user_id', lineUserId)
      const res = await fetch('/api/auth/me', { headers: { 'x-line-userid': lineUserId } })
      const data = await res.json()
      if (!data.user?.is_admin) {
        localStorage.removeItem('line_user_id')
        toast.error('ไม่มีสิทธิ์เข้าถึงระบบ Admin')
        return
      }
      navigate('/admin/dashboard')
    } catch {
      toast.error('เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-500 text-sm">LINE Sale POS</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">LINE User ID</label>
            <input
              value={lineUserId}
              onChange={(e) => setLineUserId(e.target.value)}
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-line-green outline-none"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-line-green text-white font-bold py-3.5 rounded-xl active:bg-line-dark disabled:opacity-60">
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}
