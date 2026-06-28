import { useEffect, useRef } from 'react'

interface ReceiptItem {
  product_name: string
  quantity: number
  price: number
  subtotal: number
}

interface ReceiptData {
  order: { order_no: string; total: number; payment_method: string; created_at: string }
  items: ReceiptItem[]
  shop: { shop_name: string; phone?: string; receipt_footer?: string }
}

interface Props {
  data: ReceiptData
  onClose: () => void
  autoPrint?: boolean
}

const METHOD: Record<string, string> = {
  cash: 'เงินสด',
  promptpay: 'QR พร้อมเพย์',
  transfer: 'โอน',
  debt: 'ค้างจ่าย',
}

export default function ReceiptPrint({ data, onClose, autoPrint }: Props) {
  const { order, items, shop } = data
  const printed = useRef(false)

  useEffect(() => {
    if (autoPrint && !printed.current) {
      printed.current = true
      setTimeout(() => window.print(), 300)
    }
  }, [autoPrint])

  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener('afterprint', handler)
    return () => window.removeEventListener('afterprint', handler)
  }, [onClose])

  const date = new Date(order.created_at)
  const dateStr = date.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* Print CSS — ซ่อน UI อื่นทั้งหมด */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-print-root { display: block !important; }
          @page { margin: 0; size: 58mm auto; }
        }
      `}</style>

      {/* Overlay (จอปกติ) */}
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl w-full max-w-xs">
          {/* Preview */}
          <div id="receipt-print-root" className="p-4 font-mono text-xs text-black" style={{ fontFamily: 'monospace', lineHeight: 1.5 }}>
            {/* Shop name */}
            <div className="text-center font-bold text-sm mb-1">{shop.shop_name}</div>
            {shop.phone && <div className="text-center">{shop.phone}</div>}
            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Order info */}
            <div className="flex justify-between">
              <span>{order.order_no}</span>
              <span>{dateStr} {timeStr}</span>
            </div>
            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Items */}
            {items.map((item, i) => (
              <div key={i}>
                <div>{item.product_name}</div>
                <div className="flex justify-between pl-2">
                  <span>{item.quantity} x {Number(item.price).toFixed(0)}</span>
                  <span>{Number(item.subtotal).toFixed(0)}</span>
                </div>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-400 my-2" />

            {/* Total */}
            <div className="flex justify-between font-bold text-sm">
              <span>รวม</span>
              <span>{Number(order.total).toFixed(0)} บาท</span>
            </div>
            <div className="text-right text-xs mt-0.5">{METHOD[order.payment_method] || order.payment_method}</div>

            {shop.receipt_footer && (
              <>
                <div className="border-t border-dashed border-gray-400 my-2" />
                <div className="text-center">{shop.receipt_footer}</div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 px-4 pb-4">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl">
              ปิด
            </button>
            <button
              onClick={() => window.print()}
              className="flex-[2] bg-line-green text-white font-bold py-3 rounded-xl"
            >
              🖨️ พิมพ์
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
