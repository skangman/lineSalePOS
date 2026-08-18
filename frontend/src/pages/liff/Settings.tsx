import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getCurrentShop, updateShop, getSettings, updateSettings } from '../../api/client'
import { speak, testVoice, listVoices, DEFAULT_TEMPLATES } from '../../utils/voice'

export default function Settings() {
  const navigate = useNavigate()
  const [shopId, setShopId] = useState<string | null>(null)
  const [shop, setShop] = useState<any>({})
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getCurrentShop(), getSettings()])
      .then(([{ shop }, { settings }]) => {
        setShopId(shop.id)
        setShop(shop)
        setSettings(settings || {})
      })
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveShop() {
    if (!shopId) return
    setSaving(true)
    try {
      await updateShop(shopId, shop)
      toast.success('บันทึกแล้ว')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function handleSaveSettings() {
    setSaving(true)
    try {
      await updateSettings(settings)
      toast.success('บันทึกการตั้งค่าเสียงแล้ว')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <Layout title="ตั้งค่าร้าน"><div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" /></div></Layout>

  return (
    <Layout title="ตั้งค่าร้าน">
      <div className="px-4 py-4 space-y-4">
        {/* Shop Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-3">ข้อมูลร้าน</h2>
          <div className="space-y-3">
            {[
              { key: 'shop_name', label: 'ชื่อร้าน', placeholder: 'ชื่อร้าน' },
              { key: 'owner_name', label: 'ชื่อเจ้าของ', placeholder: 'ชื่อเจ้าของ' },
              { key: 'phone', label: 'เบอร์โทร', placeholder: '0XX-XXX-XXXX' },
              { key: 'promptpay_number', label: 'เลข PromptPay', placeholder: 'เบอร์มือถือหรือเลขบัตรประชาชน' },
              { key: 'market_area', label: 'ตลาด/พื้นที่ขาย', placeholder: 'ชื่อตลาด' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                <input value={shop[key] || ''} onChange={(e) => setShop({ ...shop, [key]: e.target.value })} placeholder={placeholder} className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base focus:border-line-green outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ข้อความท้ายใบเสร็จ</label>
              <input value={shop.receipt_footer || ''} onChange={(e) => setShop({ ...shop, receipt_footer: e.target.value })} placeholder="ขอบคุณที่ใช้บริการ" className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base focus:border-line-green outline-none" />
            </div>

            {/* Toggles */}
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="font-medium text-gray-800">🔊 เปิดใช้เสียงพูด</span>
              <input type="checkbox" checked={shop.voice_enabled ?? true} onChange={(e) => setShop({ ...shop, voice_enabled: e.target.checked })} className="w-5 h-5 accent-line-green" />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="font-medium text-gray-800">📱 แจ้งเตือน LINE</span>
              <input type="checkbox" checked={shop.line_notify_enabled ?? true} onChange={(e) => setShop({ ...shop, line_notify_enabled: e.target.checked })} className="w-5 h-5 accent-line-green" />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="font-medium text-gray-800">🖨️ ปรินท์ใบเสร็จอัตโนมัติหลังชำระ</span>
              <input type="checkbox"
                checked={localStorage.getItem('auto_print') === 'true'}
                onChange={(e) => {
                  localStorage.setItem('auto_print', String(e.target.checked))
                  setShop({ ...shop })
                }}
                className="w-5 h-5 accent-line-green"
              />
            </label>
          </div>
          <button onClick={handleSaveShop} disabled={saving} className="w-full bg-line-green text-white font-bold py-3.5 rounded-xl mt-4 active:bg-line-dark disabled:opacity-60">
            {saving ? 'บันทึก...' : 'บันทึกข้อมูลร้าน'}
          </button>
        </div>

        {/* Voice Templates — ซ่อนไว้ชั่วคราว */}
        {false && <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-800">รูปแบบข้อความเสียง</h2>
            <button
              onClick={() => testVoice()}
              className="bg-line-green text-white text-sm px-3 py-1.5 rounded-lg active:bg-line-dark"
            >
              🔊 ทดสอบ
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-1">ใช้ {'{'}total{'}'} {'{'}cash_received{'}'} {'{'}change{'}'} {'{'}total_sales{'}'}</p>
          <button
            onClick={() => {
              const voices = listVoices()
              const thVoices = voices.filter((v) => v.lang.startsWith('th'))
              if (thVoices.length === 0) {
                alert('ไม่พบเสียงภาษาไทยในเครื่องนี้\n\nวิธีแก้:\n- iPhone: ตั้งค่า › การช่วยการเข้าถึง › เนื้อหาที่พูด › เสียง › เพิ่มภาษาไทย\n- Android: ตั้งค่า › การช่วยเหลือพิเศษ › Text-to-speech › ดาวน์โหลดภาษาไทย')
              } else {
                alert(`พบเสียงภาษาไทย ${thVoices.length} เสียง:\n${thVoices.map((v) => `• ${v.name} (${v.lang})`).join('\n')}`)
              }
            }}
            className="text-xs text-blue-500 underline mb-3"
          >
            ตรวจสอบเสียงภาษาไทยในเครื่อง
          </button>
          {[
            { key: 'voice_template_cash', label: '💵 เงินสด', def: DEFAULT_TEMPLATES.cash },
            { key: 'voice_template_transfer', label: '📱 โอน', def: DEFAULT_TEMPLATES.transfer },
            { key: 'voice_template_promptpay', label: '📲 QR', def: DEFAULT_TEMPLATES.promptpay },
            { key: 'voice_template_debt', label: '📝 ค้างจ่าย', def: DEFAULT_TEMPLATES.debt },
            { key: 'voice_template_close', label: '🏪 ปิดร้าน', def: DEFAULT_TEMPLATES.close },
          ].map(({ key, label, def }) => (
            <div key={key} className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
              <div className="flex gap-2">
                <input
                  value={settings[key] || def}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-line-green outline-none"
                />
                <button
                  onClick={() => speak(settings[key] || def)}
                  className="bg-gray-100 px-3 rounded-xl text-lg active:bg-gray-200"
                >
                  🔊
                </button>
              </div>
            </div>
          ))}
          <button onClick={handleSaveSettings} disabled={saving} className="w-full bg-line-green text-white font-bold py-3.5 rounded-xl mt-2 active:bg-line-dark disabled:opacity-60">
            {saving ? 'บันทึก...' : 'บันทึกการตั้งค่าเสียง'}
          </button>
        </div>}

        {/* Links */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-1">
          {[
            { label: '📦 จัดการสินค้า', path: '/liff/products' },
            { label: '🗂 จัดการหมวดหมู่', path: '/liff/categories' },
            { label: '📦 จัดการสต๊อก', path: '/liff/stock' },
            // เดิม "👥 จัดการพนักงาน" ไป /liff/staff — ปิดฟีเจอร์นี้ชั่วคราว แทนด้วย Profile เจ้าของ
            { label: '👤 Profile เจ้าของ', path: '/liff/profile' },
            { label: '💎 แพ็คเกจของฉัน', path: '/liff/plans' },
          ].map(({ label, path }) => (
            <button key={path} onClick={() => navigate(path)} className="w-full text-left py-3 border-b last:border-0 text-gray-700 font-medium flex justify-between items-center">
              <span>{label}</span>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            if (!confirm('ออกจากระบบ?')) return
            localStorage.clear()
            sessionStorage.setItem('dev_logged_out', 'true') // กันโหมด dev (localhost) auto login ตัวเองกลับ
            window.location.href = '/liff/dashboard'
          }}
          className="w-full py-4 rounded-2xl border-2 border-red-300 text-red-500 font-bold active:bg-red-50"
        >
          🚪 ออกจากระบบ
        </button>
      </div>
    </Layout>
  )
}
