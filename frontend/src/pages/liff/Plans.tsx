import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import QRCode from 'react-qr-code'
import generatePayload from 'promptpay-qr'
import Layout from '../../components/Layout'
import api, { uploadImage } from '../../api/client'

interface Plan {
  id: number
  name: string
  slug: string
  price: string
  max_products: number
  max_orders_per_day: number
  max_staff: number
  has_reports: boolean
  has_profit_report: boolean
  has_stock: boolean
  has_daily_summary_line: boolean
}

const PLAN_EMOJI: Record<string, string> = { free: '🆓', pro: '⭐', premium: '👑' }
const PLAN_COLOR: Record<string, string> = {
  free: 'border-gray-200 bg-white',
  pro: 'border-line-green bg-green-50',
  premium: 'border-yellow-400 bg-yellow-50',
}
const PLAN_BTN: Record<string, string> = {
  free: 'bg-gray-400',
  pro: 'bg-line-green',
  premium: 'bg-yellow-500',
}

function feat(ok: boolean | number, label: string) {
  const has = ok === true || (typeof ok === 'number' && ok !== 0)
  return (
    <div className={`flex items-center gap-2 text-sm ${has ? 'text-gray-700' : 'text-gray-300'}`}>
      <span>{has ? '✅' : '❌'}</span><span>{label}</span>
    </div>
  )
}

export default function Plans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentSlug, setCurrentSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [adminPromptpay, setAdminPromptpay] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<any>(null)
  const [slipUrl, setSlipUrl] = useState('')
  const [uploadingSlip, setUploadingSlip] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      api.get('/shops/plans'),
      api.get('/shops/current'),
      api.get('/upgrades/payment-info'),
      api.get('/upgrades/my'),
    ]).then(([p, s, pay, req]) => {
      setPlans(p.data.plans)
      setCurrentSlug(s.data.shop?.plan_slug || 'free')
      setAdminPromptpay(pay.data.promptpay)
      setPendingRequest(req.data.request)
    }).catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleUploadSlip(file: File) {
    setUploadingSlip(true)
    try {
      const { url } = await uploadImage(file)
      setSlipUrl(url)
    } catch (err: any) {
      toast.error('อัปโหลดสลิปไม่สำเร็จ')
    } finally {
      setUploadingSlip(false)
    }
  }

  async function handleRequestUpgrade() {
    if (!selectedPlan) return
    if (!slipUrl) return toast.error('กรุณาอัปโหลดสลิปก่อน')
    setSubmitting(true)
    try {
      await api.post('/upgrades', { plan_id: selectedPlan.id, slip_url: slipUrl })
      toast.success('แจ้งชำระแล้ว รอแอดมินอนุมัติ ✅')
      setPendingRequest({ plan_name: selectedPlan.name, status: 'pending' })
      setSelectedPlan(null)
      setSlipUrl('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const qrPayload = selectedPlan && adminPromptpay
    ? generatePayload(adminPromptpay, { amount: Number(selectedPlan.price) })
    : ''

  if (loading) return (
    <Layout title="แพ็คเกจ">
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  )

  return (
    <Layout title="แพ็คเกจ">
      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">

        {/* คำขอที่รอ */}
        {pendingRequest?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 text-center">
            <p className="text-lg">⏳</p>
            <p className="font-bold text-yellow-800">รอแอดมินอนุมัติ</p>
            <p className="text-sm text-yellow-600">คำขออัปเกรดเป็น {pendingRequest.plan_name} กำลังรอการตรวจสอบ</p>
          </div>
        )}

        <p className="text-center text-gray-500 text-sm">เลือกแพ็คเกจที่เหมาะกับร้านของคุณ</p>

        {plans.map((plan) => {
          const isCurrent = plan.slug === currentSlug
          return (
            <div key={plan.id} className={`rounded-2xl border-2 p-5 ${PLAN_COLOR[plan.slug] || 'border-gray-200 bg-white'} ${isCurrent ? 'ring-2 ring-offset-1 ring-line-green' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xl font-bold text-gray-800">{PLAN_EMOJI[plan.slug]} {plan.name}</p>
                  {isCurrent && <span className="text-xs bg-line-green text-white px-2 py-0.5 rounded-full mt-1 inline-block">แพ็คเกจปัจจุบัน</span>}
                </div>
                <div className="text-right">
                  {Number(plan.price) === 0
                    ? <p className="text-2xl font-bold text-gray-800">ฟรี</p>
                    : <><p className="text-2xl font-bold text-gray-800">{Number(plan.price).toLocaleString('th-TH')}</p><p className="text-xs text-gray-400">บาท/เดือน</p></>
                  }
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                {feat(plan.max_products === -1 ? true : plan.max_products, `สินค้า ${plan.max_products === -1 ? 'ไม่จำกัด' : `สูงสุด ${plan.max_products} รายการ`}`)}
                {feat(plan.max_orders_per_day === -1 ? true : plan.max_orders_per_day, `บิล/วัน ${plan.max_orders_per_day === -1 ? 'ไม่จำกัด' : `สูงสุด ${plan.max_orders_per_day} บิล`}`)}
                {feat(plan.max_staff === -1 ? true : plan.max_staff > 0, `พนักงาน ${plan.max_staff === -1 ? 'ไม่จำกัด' : plan.max_staff > 0 ? `สูงสุด ${plan.max_staff} คน` : 'ไม่รองรับ'}`)}
                {feat(plan.has_reports, 'รายงานยอดขาย')}
                {feat(plan.has_profit_report, 'รายงานกำไร')}
                {feat(plan.has_stock, 'จัดการสต็อก')}
                {feat(plan.has_daily_summary_line, 'สรุปยอดแจ้ง LINE อัตโนมัติ')}
              </div>

              {isCurrent ? (
                <div className="w-full py-3 rounded-xl bg-gray-100 text-center text-gray-500 font-medium text-sm">ใช้งานอยู่</div>
              ) : Number(plan.price) === 0 ? null : (
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-3 rounded-xl text-white font-bold text-sm active:opacity-80 ${PLAN_BTN[plan.slug] || 'bg-gray-500'}`}
                >
                  อัปเกรดเป็น {plan.name}
                </button>
              )}
            </div>
          )
        })}
        <p className="text-center text-xs text-gray-400 pb-4">ติดต่อสอบถาม LINE: @linesalepos</p>
      </div>

      {/* Modal ชำระเงิน */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h2 className="font-bold text-lg text-center mb-1">อัปเกรดเป็น {selectedPlan.name}</h2>
            <p className="text-center text-gray-500 text-sm mb-4">โอนเงิน {Number(selectedPlan.price).toLocaleString('th-TH')} บาท แล้วกดแจ้งชำระ</p>

            {adminPromptpay && qrPayload ? (
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                  <QRCode value={qrPayload} size={180} />
                </div>
              </div>
            ) : null}

            <p className="text-center text-sm text-gray-500 mb-4">PromptPay: <span className="font-bold text-gray-800">{adminPromptpay}</span></p>

            {/* อัปโหลดสลิป */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUploadSlip(e.target.files[0])} />

            {slipUrl ? (
              <div className="mb-3 relative">
                <img src={slipUrl} alt="slip" className="w-full max-h-48 object-contain rounded-xl border-2 border-line-green" />
                <button onClick={() => setSlipUrl('')} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold">✕</button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingSlip}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-400 text-sm mb-3 active:bg-gray-50"
              >
                {uploadingSlip ? '⏳ กำลังอัปโหลด...' : '📎 แนบสลิปโอนเงิน'}
              </button>
            )}

            <button
              onClick={handleRequestUpgrade}
              disabled={submitting || !slipUrl}
              className="w-full bg-line-green text-white font-bold py-3.5 rounded-xl mb-2 active:bg-line-dark disabled:opacity-60"
            >
              {submitting ? 'กำลังส่ง...' : '✅ แจ้งชำระเงินแล้ว'}
            </button>
            <button onClick={() => { setSelectedPlan(null); setSlipUrl('') }} className="w-full text-gray-400 text-sm py-2">ยกเลิก</button>
          </div>
        </div>
      )}
    </Layout>
  )
}
