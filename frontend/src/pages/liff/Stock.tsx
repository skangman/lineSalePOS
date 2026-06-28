import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getStock, restockProduct, adjustStock } from '../../api/client'
import type { StockProduct } from '../../types'

export default function Stock() {
  const navigate = useNavigate()
  const [stock, setStock] = useState<StockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const [selected, setSelected] = useState<StockProduct | null>(null)
  const [mode, setMode] = useState<'restock' | 'adjust'>('restock')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')

  async function load() {
    try {
      const { stock } = await getStock()
      setStock(stock)
    } catch (err: any) {
      if (err.status === 403) setBlocked(true)
      else toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!qty) return toast.error('กรุณากรอกจำนวน')
    try {
      if (mode === 'restock') {
        await restockProduct({ product_id: selected!.id, quantity: Number(qty), note })
        toast.success(`เพิ่มสต๊อก ${qty} ชิ้น`)
      } else {
        await adjustStock({ product_id: selected!.id, quantity: Number(qty), note })
        toast.success(`ปรับสต๊อกเป็น ${qty} ชิ้น`)
      }
      setSelected(null)
      setQty('')
      setNote('')
      await load()
    } catch (err: any) { toast.error(err.message) }
  }

  if (blocked) return (
    <Layout title="จัดการสต็อก">
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <p className="text-lg font-bold text-gray-800 mb-2">ฟีเจอร์นี้ไม่รองรับในแพ็คเกจ Free</p>
        <p className="text-gray-500 text-sm mb-6">อัปเกรดเป็น Premium เพื่อใช้งานระบบสต็อก</p>
        <button onClick={() => navigate('/liff/plans')} className="bg-line-green text-white font-bold px-8 py-3 rounded-xl active:bg-line-dark">
          💎 ดูแพ็คเกจ
        </button>
      </div>
    </Layout>
  )

  return (
    <Layout title="จัดการสต๊อก">
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {stock.filter((p) => !p.is_unlimited_stock).map((p) => (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between ${p.low_stock ? 'border border-red-200' : ''}`}>
                <div>
                  <p className="font-medium text-gray-800">{p.product_name}</p>
                  <p className={`text-sm font-bold ${p.low_stock ? 'text-red-500' : 'text-gray-600'}`}>
                    {p.low_stock ? '⚠️ ' : ''}คงเหลือ: {p.stock_quantity} ชิ้น
                  </p>
                </div>
                <button
                  onClick={() => setSelected(p)}
                  className="bg-line-green text-white px-4 py-2 rounded-xl text-sm font-bold active:bg-line-dark"
                >
                  จัดการ
                </button>
              </div>
            ))}
            {stock.filter((p) => p.is_unlimited_stock).length > 0 && (
              <div className="text-gray-400 text-sm text-center py-2">
                สินค้าไม่จำกัดสต๊อก {stock.filter((p) => p.is_unlimited_stock).length} รายการ
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5">
            <h3 className="font-bold text-lg mb-1">{selected.product_name}</h3>
            <p className="text-gray-500 text-sm mb-4">คงเหลือปัจจุบัน: {selected.stock_quantity} ชิ้น</p>

            <div className="flex gap-2 mb-4">
              {(['restock', 'adjust'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-xl font-semibold text-sm ${mode === m ? 'bg-line-green text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {m === 'restock' ? 'เพิ่มสต๊อก' : 'ปรับสต๊อก'}
                </button>
              ))}
            </div>

            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder={mode === 'restock' ? 'จำนวนที่รับเข้า' : 'จำนวนคงเหลือใหม่'} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base mb-3 focus:border-line-green outline-none" autoFocus />
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)" className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base mb-4 focus:border-line-green outline-none" />

            <div className="flex gap-3">
              <button onClick={() => { setSelected(null); setQty(''); setNote('') }} className="flex-1 py-3.5 border-2 border-gray-300 rounded-xl font-bold text-gray-700">ยกเลิก</button>
              <button onClick={handleSave} className="flex-1 py-3.5 bg-line-green text-white rounded-xl font-bold active:bg-line-dark">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
