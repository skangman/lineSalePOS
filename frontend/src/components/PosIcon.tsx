// ไอคอนเครื่อง POS แบบของจริง: ตัวเครื่องสีเข้ม + จอสีเขียวโชว์เครื่องหมายบาท + ช่องรูดบัตร + ปุ่มกด
export default function PosIcon({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 110" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* คลื่นแตะจ่าย (contactless) มุมขวาบน */}
      <path d="M84 20c5 5 5 13 0 18" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      <path d="M78 25c2.5 2.5 2.5 7 0 10" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />

      {/* ตัวเครื่อง */}
      <rect x="16" y="8" width="60" height="88" rx="10" fill="#1F2937" />

      {/* ช่องรูดบัตรด้านข้าง */}
      <rect x="70" y="26" width="5" height="18" rx="2.5" fill="#4B5563" />

      {/* จอแสดงผล */}
      <rect x="26" y="18" width="40" height="34" rx="5" fill="#06C755" />
      <path d="M36 35l7 7 15-15" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      {/* ปุ่มกด */}
      <rect x="30" y="60" width="10" height="8" rx="2.5" fill="#9CA3AF" />
      <rect x="41" y="60" width="10" height="8" rx="2.5" fill="#9CA3AF" />
      <rect x="52" y="60" width="10" height="8" rx="2.5" fill="#9CA3AF" />
      <rect x="30" y="72" width="10" height="8" rx="2.5" fill="#9CA3AF" />
      <rect x="41" y="72" width="10" height="8" rx="2.5" fill="#9CA3AF" />
      <rect x="52" y="72" width="10" height="8" rx="2.5" fill="#9CA3AF" />

      {/* ฐานเครื่อง */}
      <rect x="26" y="96" width="40" height="6" rx="3" fill="#111827" />
    </svg>
  )
}
