import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import api from '../../api/client'

interface DebtSummary {
  customer_name: string
  bill_count: number
  total_amount: string
  remaining: string
}

interface Debt {
  id: string
  customer_name: string
  amount: string
  paid_amount: string
  order_no: string
  order_date: string
  is_paid: boolean
}

export default function Debts() {
  const [summary, setSummary] = useState<DebtSummary[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([
        api.get('/debts/summary'),
        api.get('/debts'),
      ])
      setSummary(s.data.summary)
      setDebts(d.data.debts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handlePay(debtId: string) {
    setPaying(debtId)
    try {
      await api.patch(`/debts/${debtId}/pay`, {})
      toast.success('รับชำระแล้ว ✅')
      await load()
      setSelected(null)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally {
      setPaying(null)
    }
  }

  const customerDebts = selected
    ? debts.filter((d) => d.customer_name === selected)
    : []

  const fmt = (n: string | number) => Number(n).toLocaleString('th-TH')

  return (
    <Layout title="รายการค้างจ่าย">
      <div className="p-4 max-w-lg mx-auto">

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : summary.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-medium">ไม่มีรายการค้างจ่าย</p>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.map((s) => (
              <div
                key={s.customer_name}
                onClick={() => setSelected(selected === s.customer_name ? null : s.customer_name)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{s.customer_name}</p>
                    <p className="text-sm text-gray-500">{s.bill_count} บิล</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-500 text-lg">{fmt(s.remaining)} ฿</p>
                    <p className="text-xs text-gray-400">ค้างอยู่</p>
                  </div>
                </div>

                {/* รายการบิลของลูกค้านี้ */}
                {selected === s.customer_name && (
                  <div className="mt-3 pt-3 border-t space-y-2" onClick={(e) => e.stopPropagation()}>
                    {customerDebts.map((d) => (
                      <div key={d.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{d.order_no}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(d.order_date).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{fmt(d.amount)} ฿</span>
                          <button
                            onClick={() => handlePay(d.id)}
                            disabled={paying === d.id}
                            className="bg-line-green text-white text-sm font-bold px-3 py-1.5 rounded-lg active:bg-line-dark disabled:opacity-60"
                          >
                            {paying === d.id ? '...' : 'รับชำระ'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
