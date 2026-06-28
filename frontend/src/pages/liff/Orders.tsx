import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getOrders } from '../../api/client'
import type { Order } from '../../types'

const METHOD_LABEL: Record<string, string> = {
  cash: '💵 เงินสด',
  transfer: '📱 โอน',
  promptpay: '📲 QR',
  debt: '📝 ค้างจ่าย',
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  paid: { label: 'ชำระแล้ว', color: 'text-green-600 bg-green-50' },
  unpaid: { label: 'ค้างจ่าย', color: 'text-yellow-600 bg-yellow-50' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-500 bg-red-50' },
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    getOrders({ date, payment_method: filter || undefined })
      .then(({ orders }) => setOrders(orders))
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [date, filter])

  return (
    <Layout title="ประวัติการขาย">
      <div className="px-4 py-3">
        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-line-green outline-none"
          />
        </div>
        <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
          {['', 'cash', /* 'transfer', */ 'promptpay', 'debt'].map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === m ? 'bg-line-green text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {m === '' ? 'ทั้งหมด' : METHOD_LABEL[m]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <span className="text-4xl block mb-2">📋</span>
            <p>ไม่มีรายการ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => {
              const status = STATUS_LABEL[o.payment_status]
              return (
                <button
                  key={o.id}
                  onClick={() => navigate(`/liff/orders/${o.id}`)}
                  className="w-full bg-white rounded-2xl shadow-sm px-4 py-3 text-left active:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{o.order_no}</p>
                      <p className="text-sm text-gray-500">{METHOD_LABEL[o.payment_method]}</p>
                      <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-line-green">{Number(o.total).toFixed(0)} ฿</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
