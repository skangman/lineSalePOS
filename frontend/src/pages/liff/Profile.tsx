import Layout from '../../components/Layout'

// Profile เจ้าของร้าน — ดูอย่างเดียว ใช้แทนหน้าจัดการพนักงานที่ปิดไปชั่วคราว
// อ่านข้อมูลจาก localStorage ที่ useLiff เซ็ตไว้ตอน login (ไม่ต้องยิง API เพิ่ม)
export default function Profile() {
  const pictureUrl = localStorage.getItem('line_picture_url')
  const displayName = localStorage.getItem('line_display_name') || 'ไม่ระบุชื่อ'

  return (
    <Layout title="Profile เจ้าของ">
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
          {pictureUrl ? (
            <img src={pictureUrl} className="w-24 h-24 rounded-full object-cover mb-4" alt="" />
          ) : (
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl mb-4">👤</div>
          )}
          <p className="font-bold text-gray-800 text-lg">{displayName}</p>
          <p className="text-sm text-gray-400 mt-1">👑 เจ้าของร้าน</p>
        </div>
      </div>
    </Layout>
  )
}
