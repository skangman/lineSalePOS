import { useState, useRef } from 'react'
import QRCode from 'react-qr-code'
import generatePayload from 'promptpay-qr'
import toast from 'react-hot-toast'
import { createOrder, getReceipt } from '../api/client'
import { useCart } from '../hooks/useCart'
import { speak, buildVoiceText, DEFAULT_TEMPLATES } from '../utils/voice'
import ReceiptPrint from './ReceiptPrint'

type PaymentMethod = 'cash' | 'transfer' | 'promptpay' | 'debt'

interface PaymentModalProps {
  onClose: () => void
  onSuccess: (orderNo: string) => void
  shopName: string
  promptpayNumber?: string
  voiceEnabled?: boolean
  voiceTemplates?: Record<string, string>
}

export default function PaymentModal({ onClose, onSuccess, shopName, promptpayNumber, voiceEnabled = true, voiceTemplates = {} }: PaymentModalProps) {
  const { items, discount, subtotal, total, clearCart } = useCart()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const submitting = useRef(false)
  const [step, setStep] = useState<'method' | 'cash' | 'qr' | 'debt' | 'done'>('method')
  const [limitError, setLimitError] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<any>(null)

  const totalAmount = total()
  const change = Number(cashReceived) - totalAmount

  const templates = { ...DEFAULT_TEMPLATES, ...voiceTemplates }

  async function handleConfirm() {
    if (method === 'cash' && step === 'method') { setStep('cash'); return }
    if (method === 'promptpay' && step === 'method') { setStep('qr'); return }
    if (method === 'debt' && step === 'method') { setStep('debt'); return }

    if (method === 'cash' && !cashReceived) {
      toast.error('กรุณากรอกจำนวนเงินที่รับ')
      return
    }
    if (method === 'cash' && Number(cashReceived) < totalAmount) {
      toast.error('เงินที่รับน้อยกว่ายอดที่ต้องจ่าย')
      return
    }
    if (method === 'debt' && !customerName) {
      toast.error('กรุณากรอกชื่อลูกค้า')
      return
    }

    if (submitting.current) return
    submitting.current = true

    // พูดทันทีที่กดยืนยัน ก่อน API call (ไม่ต้องรอ network)
    if (voiceEnabled) {
      if (method === 'cash') {
        speak(buildVoiceText(templates.cash, { cash_received: Number(cashReceived).toFixed(0), change: Math.max(0, change).toFixed(0) }))
      } else if (method === 'transfer') {
        speak(buildVoiceText(templates.transfer, { total: totalAmount.toFixed(0) }))
      } else if (method === 'promptpay') {
        speak(buildVoiceText(templates.promptpay, { total: totalAmount.toFixed(0) }))
      } else if (method === 'debt') {
        speak(buildVoiceText(templates.debt, { total: totalAmount.toFixed(0) }))
      }
    }

    setLoading(true)
    try {
      const orderData = {
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        discount,
        payment_method: method,
        cash_received: method === 'cash' ? Number(cashReceived) : undefined,
        customer_name: method === 'debt' ? customerName : undefined,
        customer_phone: method === 'debt' ? customerPhone : undefined,
      }

      const { order } = await createOrder(orderData)
      clearCart()
      onSuccess(order.order_no)

      // Auto print หรือรอกดเอง
      if (localStorage.getItem('auto_print') === 'true') {
        try {
          const { receipt } = await getReceipt(order.id)
          setReceiptData(receipt?.receipt_data)
        } catch {}
      }
    } catch (err: any) {
      submitting.current = false
      if (err.status === 403) {
        if (voiceEnabled) speak('หมดโควต้าแล้ว อัปเกรดแพ็คเกจเพื่อขายต่อ')
        setLimitError(err.message)
      } else {
        toast.error(err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
      }
    } finally {
      setLoading(false)
    }
  }

  const methodLabel: Record<PaymentMethod, string> = {
    cash: '💵 เงินสด',
    transfer: '📱 โอนเงิน',
    promptpay: '📲 QR PromptPay',
    debt: '📝 ค้างจ่าย',
  }

  if (receiptData) return (
    <ReceiptPrint
      data={receiptData}
      autoPrint={localStorage.getItem('auto_print') === 'true'}
      onClose={() => { setReceiptData(null); onClose() }}
    />
  )

  if (limitError) return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-bold text-gray-800 text-lg mb-2">ครบโควต้าแล้ว!</p>
        {limitError.split('\n').map((line, i) => (
          <p key={i} className="text-gray-500 text-sm mb-1">{line}</p>
        ))}
        <button
          onClick={() => { onClose(); window.location.href = '/liff/plans' }}
          className="w-full mt-4 bg-line-green text-white font-bold py-3 rounded-xl active:bg-line-dark"
        >
          💎 ดูแพ็คเกจ
        </button>
        <button onClick={onClose} className="w-full mt-2 text-gray-400 text-sm py-2">ปิด</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">รับชำระเงิน</h2>
            <button onClick={onClose} className="text-gray-400 text-3xl leading-none">&times;</button>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            {items.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm py-1">
                <span>{item.product_name} x{item.quantity}</span>
                <span>{item.subtotal.toFixed(0)} ฿</span>
              </div>
            ))}
            {discount > 0 && (
              <div className="flex justify-between text-sm py-1 text-red-500">
                <span>ส่วนลด</span>
                <span>-{discount.toFixed(0)} ฿</span>
              </div>
            )}
            <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
              <span>รวมทั้งหมด</span>
              <span className="text-line-green">{totalAmount.toFixed(0)} ฿</span>
            </div>
          </div>

          {/* Payment method selection */}
          {step === 'method' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(['cash', /* 'transfer', */ 'promptpay', 'debt'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`p-4 rounded-xl border-2 text-center font-semibold text-base transition-all ${
                    method === m
                      ? 'border-line-green bg-green-50 text-line-green'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {methodLabel[m]}
                </button>
              ))}
            </div>
          )}

          {/* Cash input */}
          {step === 'cash' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">รับเงินมา (บาท)</label>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-center focus:border-line-green outline-none"
                placeholder="0"
                autoFocus
              />
              {cashReceived && Number(cashReceived) >= totalAmount && (
                <div className="mt-3 bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-sm text-gray-600">เงินทอน</p>
                  <p className="text-2xl font-bold text-line-green">{change.toFixed(0)} ฿</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[20, 50, 100, 500, 1000, Math.ceil(totalAmount / 10) * 10].map((v) => (
                  <button
                    key={v}
                    onClick={() => setCashReceived(String(v))}
                    className="bg-gray-100 rounded-lg py-2 text-sm font-medium active:bg-gray-200"
                  >
                    {v} ฿
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QR PromptPay */}
          {step === 'qr' && (
            <div className="mb-4 text-center">
              <p className="text-gray-600 mb-3">สแกน QR เพื่อชำระ {totalAmount.toFixed(0)} บาท</p>
              <div className="flex justify-center bg-white p-4 rounded-xl border">
                {promptpayNumber ? (
                  <QRCode
                    value={generatePayload(promptpayNumber, { amount: totalAmount })}
                    size={200}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm text-center p-4">
                    กรุณาตั้งค่าเลข PromptPay ในหน้าตั้งค่าร้าน
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">กดยืนยันเมื่อลูกค้าจ่ายแล้ว</p>
            </div>
          )}

          {/* Debt */}
          {step === 'debt' && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อลูกค้า *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
                  placeholder="ชื่อลูกค้า"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร (ถ้ามี)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
                  placeholder="0XX-XXX-XXXX"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {step !== 'method' && (
              <button
                onClick={() => setStep('method')}
                className="flex-1 py-4 rounded-xl border-2 border-gray-300 font-semibold text-gray-700 text-lg active:bg-gray-50"
              >
                ย้อนกลับ
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-4 rounded-xl bg-line-green text-white font-bold text-lg active:bg-line-dark disabled:opacity-60"
            >
              {loading ? 'กำลังบันทึก...' : step === 'method' ? `ชำระ ${methodLabel[method]}` : 'ยืนยัน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
