import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { registerShop } from '../../api/client'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    product_type: '',
    market_area: '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.shop_name || !form.owner_name) {
      toast.error('กรุณากรอกชื่อร้านและชื่อเจ้าของ')
      return
    }

    setLoading(true)
    try {
      await registerShop(form)
      toast.success('สมัครร้านสำเร็จ! 🎉')
      navigate('/liff/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const PRODUCT_TYPES = ['อาหาร', 'เครื่องดื่ม', 'เสื้อผ้า', 'ของสด', 'ของหวาน', 'เบเกอรี่', 'ผลไม้', 'อื่น ๆ']

  return (
    <div className="min-h-screen bg-gradient-to-b from-line-green to-line-dark flex flex-col">
      {/* Header */}
      <div className="text-white text-center pt-12 pb-8 px-6">
        <div className="text-5xl mb-3">🏪</div>
        <h1 className="text-2xl font-bold">สมัครร้านค้า</h1>
        <p className="text-green-100 mt-1">เริ่มขายของผ่าน LINE ได้เลย</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-t-3xl flex-1 px-5 pt-6 pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อร้าน *</label>
            <input
              name="shop_name"
              value={form.shop_name}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
              placeholder="เช่น ร้านป้าแดง"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อเจ้าของร้าน *</label>
            <input
              name="owner_name"
              value={form.owner_name}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">เบอร์โทร</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
              placeholder="0XX-XXX-XXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ประเภทสินค้าหลัก</label>
            <select
              name="product_type"
              value={form.product_type}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none bg-white"
            >
              <option value="">เลือกประเภท</option>
              {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ตลาด / พื้นที่ขาย</label>
            <input
              name="market_area"
              value={form.market_area}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
              placeholder="เช่น ตลาดนัดจตุจักร"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-line-green text-white font-bold text-lg py-4 rounded-xl mt-2 active:bg-line-dark disabled:opacity-60 shadow-lg"
          >
            {loading ? 'กำลังสมัคร...' : '✅ สมัครร้านค้า'}
          </button>
        </form>
      </div>
    </div>
  )
}
