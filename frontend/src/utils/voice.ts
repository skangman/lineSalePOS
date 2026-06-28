let voiceEnabled = true

export function setVoiceEnabled(enabled: boolean) {
  voiceEnabled = enabled
}

// โหลด voices ไว้ล่วงหน้า เพราะ getVoices() คืนว่างถ้าเรียกก่อน voiceschanged
let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices() {
  cachedVoices = window.speechSynthesis?.getVoices() ?? []
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

function getThaiVoice(): SpeechSynthesisVoice | undefined {
  const voices = cachedVoices.length > 0 ? cachedVoices : (window.speechSynthesis?.getVoices() ?? [])
  return (
    voices.find((v) => v.lang === 'th-TH') ??
    voices.find((v) => v.lang.startsWith('th'))
  )
}

export function speak(text: string) {
  if (!voiceEnabled) return
  if (!window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'th-TH'
  utter.rate = 0.9
  utter.pitch = 1.1
  utter.volume = 1

  const thaiVoice = getThaiVoice()
  if (thaiVoice) {
    utter.voice = thaiVoice
  }

  // iOS Safari ต้องการ delay เล็กน้อยหลัง cancel
  setTimeout(() => window.speechSynthesis.speak(utter), 50)
}

export function buildVoiceText(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))
}

export const DEFAULT_TEMPLATES = {
  cash: 'รับเงิน {cash_received} บาท ทอน {change} บาทค่ะ',
  transfer: 'รับยอดโอน {total} บาทแล้วค่ะ',
  promptpay: 'รับยอดโอน {total} บาทแล้วค่ะ',
  debt: 'บันทึกรายการค้างจ่าย {total} บาทแล้วค่ะ',
  close: 'วันนี้ขายได้ทั้งหมด {total_sales} บาทค่ะ',
}

// ทดสอบเสียงภาษาไทย — เรียกจากหน้า Settings
export function testVoice() {
  speak('ทดสอบเสียงภาษาไทย รับเงิน หนึ่งร้อยบาทค่ะ')
}

// ดู voices ที่มีในเครื่อง (debug)
export function listVoices() {
  return (window.speechSynthesis?.getVoices() ?? []).map((v) => ({
    name: v.name,
    lang: v.lang,
  }))
}
