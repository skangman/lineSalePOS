import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import api, { getOrder, cancelOrder, sendReceiptLine, getReceipt } from '../../api/client'
import { speak } from '../../utils/voice'
import type { OrderDetail } from '../../types'
import ReceiptPrint from '../../components/ReceiptPrint'

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [paying, setPaying] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)

  async function handlePrint() {
    try {
      const { receipt } = await getReceipt(id!)
      setReceiptData(receipt?.receipt_data)
    } catch { toast.error('ไม่พบใบเสร็จ') }
  }

  useEffect(() => {
    getOrder(id!).then(({ order, items }) => setOrder({ ...order, items }))
      .catch((err: any) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleCancel() {
    if (!cancelReason.trim()) return toast.error('กรุณาระบุเหตุผล')
    try {
      await cancelOrder(id!, cancelReason)
      toast.success('ยกเลิกบิลแล้ว')
      navigate('/liff/orders')
    } catch (err: any) { toast.error(err.message) }
  }

  async function handlePayDebt() {
    setPaying(true)
    try {
      const { data } = await api.get(`/debts?status=unpaid`)
      const debt = data.debts.find((d: any) => d.order_id === id)
      if (!debt) throw new Error('ไม่พบรายการหนี้')
      await api.patch(`/debts/${debt.id}/pay`, {})
      speak(`รับชำระค้างจ่ายแล้ว ${Number(order?.total ?? 0).toFixed(0)} บาท`)
      toast.success('รับชำระแล้ว ✅')
      const result = await getOrder(id!)
      setOrder({ ...result.order, items: result.items })
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message)
    } finally {
      setPaying(false)
    }
  }

  async function handleSendReceipt() {
    try {
      await sendReceiptLine(id!)
      toast.success('ส่งใบเสร็จเข้า LINE แล้ว')
    } catch (err: any) { toast.error(err.message) }
  }

  if (loading) return <Layout title="รายละเอียดบิล"><div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" /></div></Layout>
  if (!order) return <Layout title="ไม่พบบิล"><p className="text-center py-10 text-gray-400">ไม่พบรายการ</p></Layout>

  const methodLabel: Record<string, string> = { cash: '💵 เงินสด', transfer: '📱 โอน', promptpay: '📲 QR', debt: '📝 ค้างจ่าย' }

  return (
    <Layout title={order.order_no}>
      <div className="px-4 py-4 space-y-4">
        {/* Status */}
        <div className={`rounded-2xl p-4 text-center font-bold text-lg ${
          order.payment_status === 'paid' ? 'bg-green-50 text-green-700' :
          order.payment_status === 'cancelled' ? 'bg-red-50 text-red-600' :
          'bg-yellow-50 text-yellow-700'
        }`}>
          {order.payment_status === 'paid' ? '✅ ชำระแล้ว' :
           order.payment_status === 'cancelled' ? '❌ ยกเลิกแล้ว' :
           '⏳ ค้างจ่าย'}
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">เลขบิล</span><span className="font-bold">{order.order_no}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">วิธีชำระ</span><span>{methodLabel[order.payment_method]}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">เวลา</span><span>{new Date(order.created_at).toLocaleString('th-TH')}</span></div>
          {order.customer_name && <div className="flex justify-between text-sm"><span className="text-gray-500">ลูกค้า</span><span>{order.customer_name}</span></div>}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3">รายการสินค้า</h3>
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between py-1.5 border-b last:border-0 text-sm">
              <span>{item.product_name} x{item.quantity}</span>
              <span className="font-medium">{Number(item.subtotal).toFixed(0)} ฿</span>
            </div>
          ))}
          {Number(order.discount) > 0 && (
            <div className="flex justify-between py-1.5 text-sm text-red-500">
              <span>ส่วนลด</span>
              <span>-{Number(order.discount).toFixed(0)} ฿</span>
            </div>
          )}
          <div className="flex justify-between pt-3 font-bold text-base border-t mt-2">
            <span>รวมทั้งหมด</span>
            <span className="text-line-green">{Number(order.total).toFixed(0)} ฿</span>
          </div>
          {order.payment_method === 'cash' && order.cash_received && (
            <>
              <div className="flex justify-between text-sm text-gray-500 mt-1"><span>รับเงิน</span><span>{Number(order.cash_received).toFixed(0)} ฿</span></div>
              <div className="flex justify-between text-sm text-gray-500"><span>ทอน</span><span>{Number(order.change_amount).toFixed(0)} ฿</span></div>
            </>
          )}
        </div>

        {/* Actions */}
        {order.payment_status !== 'cancelled' && (
          <div className="space-y-3">
            {order.payment_status === 'unpaid' && (
              <button
                onClick={handlePayDebt}
                disabled={paying}
                className="w-full bg-line-green text-white font-bold py-3.5 rounded-xl active:bg-line-dark disabled:opacity-60"
              >
                {paying ? 'กำลังบันทึก...' : '💰 รับชำระเงิน'}
              </button>
            )}
            <button onClick={handlePrint} className="w-full border-2 border-gray-300 text-gray-700 font-bold py-3.5 rounded-xl active:bg-gray-50">
              🖨️ พิมพ์ใบเสร็จ
            </button>
            <button onClick={handleSendReceipt} className="w-full border-2 border-line-green text-line-green font-bold py-3.5 rounded-xl active:bg-green-50">
              📨 ส่งใบเสร็จเข้า LINE
            </button>
            <button onClick={() => setShowCancel(true)} className="w-full border-2 border-red-400 text-red-500 font-bold py-3.5 rounded-xl active:bg-red-50">
              ❌ ยกเลิกบิลนี้
            </button>
          </div>
        )}

        {order.cancel_reason && (
          <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600">
            <p className="font-bold">เหตุผลที่ยกเลิก:</p>
            <p>{order.cancel_reason}</p>
          </div>
        )}
      </div>

      {receiptData && (
        <ReceiptPrint data={receiptData} onClose={() => setReceiptData(null)} />
      )}

      {/* Cancel Dialog */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-5">
            <h3 className="text-lg font-bold text-red-600 mb-3">❌ ยืนยันยกเลิกบิล?</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="ระบุเหตุผล..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-3 resize-none focus:border-red-400 outline-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 py-3.5 border-2 border-gray-300 rounded-xl font-bold text-gray-700">ไม่ยกเลิก</button>
              <button onClick={handleCancel} className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold active:bg-red-600">ยืนยันยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
