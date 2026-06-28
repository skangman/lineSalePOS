import * as line from '@line/bot-sdk'

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
})

export async function pushMessage(lineUserId: string, messages: line.messagingApi.Message[]) {
  try {
    await client.pushMessage({
      to: lineUserId,
      messages,
    })
  } catch (err) {
    console.error('LINE push message error:', err)
    throw err
  }
}

export function buildSaleMessage(params: {
  orderNo: string
  total: number
  paymentMethod: string
  items: Array<{ product_name: string; quantity: number; subtotal: number }>
  cashReceived?: number
  changeAmount?: number
  customerName?: string
}): line.messagingApi.TextMessage {
  const { orderNo, total, paymentMethod, items, cashReceived, changeAmount, customerName } = params

  const methodLabel: Record<string, string> = {
    cash: '💵 เงินสด',
    transfer: '📱 โอนเงิน',
    promptpay: '📲 QR PromptPay',
    debt: '📝 ค้างจ่าย',
  }

  const itemLines = items
    .map((i) => `• ${i.product_name} x${i.quantity} = ${i.subtotal.toFixed(0)} บาท`)
    .join('\n')

  let extra = ''
  if (paymentMethod === 'cash' && cashReceived != null) {
    extra = `\nรับเงิน: ${cashReceived.toFixed(0)} บาท\nทอน: ${(changeAmount ?? 0).toFixed(0)} บาท`
  }
  if (paymentMethod === 'debt' && customerName) {
    extra = `\nลูกค้า: ${customerName}`
  }

  const now = new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    type: 'text',
    text: `✅ รับเงินแล้ว\n\nบิล: ${orderNo}\nยอดขาย: ${total.toFixed(0)} บาท\nช่องทาง: ${methodLabel[paymentMethod] || paymentMethod}\nเวลา: ${now}\n\nรายการ:\n${itemLines}${extra}\n\n💰 รวม ${total.toFixed(0)} บาท`,
  }
}

export function buildRegisterMessage(shopName: string): line.messagingApi.TextMessage {
  return {
    type: 'text',
    text: `🎉 สมัครร้านสำเร็จแล้ว!\n\nร้าน: ${shopName}\n\nกดเมนู "เปิด POS" เพื่อเริ่มขายสินค้าได้เลยค่ะ`,
  }
}

export function buildCancelMessage(params: {
  orderNo: string
  total: number
  reason: string
}): line.messagingApi.TextMessage {
  return {
    type: 'text',
    text: `❌ ยกเลิกบิลแล้ว\n\nบิล: ${params.orderNo}\nยอด: ${params.total.toFixed(0)} บาท\nเหตุผล: ${params.reason}`,
  }
}

export function buildDebtPaidMessage(params: {
  customerName: string
  orderNo: string
  amount: number
}): line.messagingApi.TextMessage {
  return {
    type: 'text',
    text: `💚 รับชำระค้างจ่ายแล้ว\n\n👤 ลูกค้า: ${params.customerName}\n🧾 บิล: ${params.orderNo}\n💰 ยอดชำระ: ${params.amount.toFixed(0)} บาท`,
  }
}

export function buildDailySummaryMessage(params: {
  date: string
  totalSales: number
  totalOrders: number
  cashTotal: number
  transferTotal: number
  promptpayTotal: number
  debtTotal: number
}): line.messagingApi.TextMessage {
  return {
    type: 'text',
    text: `📊 สรุปยอดขาย ${params.date}\n\n💰 รวมทั้งหมด: ${params.totalSales.toFixed(0)} บาท\n🧾 จำนวนบิล: ${params.totalOrders} บิล\n\n💵 เงินสด: ${params.cashTotal.toFixed(0)} บาท\n📱 โอน: ${params.transferTotal.toFixed(0)} บาท\n📲 QR: ${params.promptpayTotal.toFixed(0)} บาท\n📝 ค้างจ่าย: ${params.debtTotal.toFixed(0)} บาท\n\nขอบคุณสำหรับวันนี้ค่ะ 🙏`,
  }
}
