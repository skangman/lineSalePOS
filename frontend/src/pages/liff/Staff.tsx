// ⚠️ ปิดใช้งานฟีเจอร์นี้ชั่วคราว — ไม่ได้ผูก route แล้ว (ดู App.tsx) เก็บไฟล์ไว้เผื่อกลับมาใช้ทีหลัง
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getStaff, inviteStaff, removeStaff } from '../../api/client'

const ROLE_LABEL: Record<string, string> = {
  owner: '👑 เจ้าของ',
  manager: '🔑 ผู้จัดการ',
  cashier: '💳 แคชเชียร์',
}

export default function Staff() {
  const [staff, setStaff] = useState<any[]>([])
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [role, setRole] = useState('cashier')
  const [loading, setLoading] = useState(true)

  async function load() {
    const { staff } = await getStaff()
    setStaff(staff)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleInvite() {
    try {
      const { invite_code } = await inviteStaff({ role })
      setInviteCode(invite_code)
    } catch (err: any) { toast.error(err.message) }
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`ลบพนักงาน "${name}"?`)) return
    try {
      await removeStaff(id)
      toast.success('ลบพนักงานแล้ว')
      await load()
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <Layout title="จัดการพนักงาน">
      <div className="px-4 py-4 space-y-4">
        {/* Invite */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-3">เพิ่มพนักงาน</h2>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 bg-white focus:border-line-green outline-none">
            <option value="cashier">แคชเชียร์</option>
            <option value="manager">ผู้จัดการ</option>
          </select>
          <button onClick={handleInvite} className="w-full bg-line-green text-white font-bold py-3.5 rounded-xl active:bg-line-dark">
            🔗 สร้างรหัสเชิญ
          </button>

          {inviteCode && (
            <div className="mt-4 bg-green-50 border-2 border-line-green rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">รหัสเชิญพนักงาน</p>
              <p className="text-4xl font-bold tracking-widest text-line-green">{inviteCode}</p>
              <p className="text-xs text-gray-400 mt-2">ให้พนักงานกรอกรหัสนี้ในหน้าเข้าร่วมร้าน</p>
              <button onClick={() => setInviteCode(null)} className="mt-2 text-gray-400 text-sm">ปิด</button>
            </div>
          )}
        </div>

        {/* Staff List */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-3">รายชื่อพนักงาน</h2>
          {loading ? (
            <div className="flex justify-center py-6"><div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" /></div>
          ) : staff.map((s) => (
            <div key={s.id} className="flex items-center gap-3 py-3 border-b last:border-0">
              {s.picture_url ? (
                <img src={s.picture_url} className="w-10 h-10 rounded-full" alt="" />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">👤</div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800">{s.display_name || 'ไม่ระบุชื่อ'}</p>
                <p className="text-sm text-gray-500">{ROLE_LABEL[s.role]}</p>
              </div>
              {s.role !== 'owner' && (
                <button onClick={() => handleRemove(s.id, s.display_name)} className="text-red-500 text-sm px-3 py-1 bg-red-50 rounded-lg">ลบ</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
