// หน้านโยบายความเป็นส่วนตัว — ไม่ผูก link จากเมนูไหนในแอป เข้าถึงได้เฉพาะรู้ URL ตรงๆ (/privacy)
// ใช้สำหรับกรอกในช่อง Privacy policy URL ของ LINE Developers Console ตอน publish channel
export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-6 md:p-10 text-gray-700 leading-relaxed">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-sm text-gray-400 mb-6">LINE Sale POS — ปรับปรุงล่าสุด 18 สิงหาคม 2569</p>

        <p className="mb-6">
          LINE Sale POS ("แอป") เป็นระบบขายของหน้าร้านสำหรับผู้ค้ารายย่อยที่ใช้งานผ่าน LINE
          เอกสารนี้อธิบายว่าเราเก็บ ใช้ และดูแลข้อมูลของผู้ใช้อย่างไร
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">ข้อมูลที่เราเก็บ</h2>
        <ul className="list-disc pl-5 space-y-1 mb-6">
          <li>ข้อมูลโปรไฟล์ LINE ที่ได้รับอนุญาตผ่าน LINE Login/LIFF: LINE User ID, ชื่อที่แสดง, รูปโปรไฟล์</li>
          <li>ข้อมูลร้านค้าที่ผู้ใช้กรอกเอง: ชื่อร้าน, ชื่อเจ้าของร้าน, เบอร์โทร, ประเภทสินค้า, พื้นที่ขาย</li>
          <li>ข้อมูลการใช้งานระบบ: รายการสินค้า, ออเดอร์การขาย, สต๊อกสินค้า ที่ผู้ใช้บันทึกเข้าระบบเอง</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">เราใช้ข้อมูลเพื่ออะไร</h2>
        <ul className="list-disc pl-5 space-y-1 mb-6">
          <li>ยืนยันตัวตนผู้ใช้งานผ่านบัญชี LINE เพื่อเข้าใช้ระบบ</li>
          <li>แสดงและจัดการข้อมูลร้านค้า สินค้า และรายการขายของผู้ใช้แต่ละคน</li>
          <li>ส่งการแจ้งเตือนที่เกี่ยวกับการขาย (เช่น สรุปยอดขาย) ผ่าน LINE ตามที่ผู้ใช้เปิดใช้งานเอง</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">การจัดเก็บและการแบ่งปันข้อมูล</h2>
        <p className="mb-6">
          ข้อมูลถูกจัดเก็บในฐานข้อมูลที่มีการเข้ารหัสการเชื่อมต่อ (SSL) เราไม่ขายหรือแบ่งปันข้อมูลผู้ใช้ให้บุคคลที่สาม
          เพื่อการโฆษณา ข้อมูลจะถูกส่งต่อเท่าที่จำเป็นต่อการให้บริการเท่านั้น (เช่น ผู้ให้บริการ hosting/ฐานข้อมูล)
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">สิทธิ์ของผู้ใช้</h2>
        <p className="mb-6">
          ผู้ใช้สามารถขอให้ลบข้อมูลร้านค้าและข้อมูลส่วนตัวออกจากระบบได้ โดยติดต่อผ่านช่องทางด้านล่าง
        </p>

        <h2 className="text-lg font-bold text-gray-900 mt-6 mb-2">ติดต่อเรา</h2>
        <p>
          หากมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ ติดต่อได้ที่ LINE OA:{' '}
          <span className="font-medium">@linesalepos</span> หรืออีเมล{' '}
          <span className="font-medium">kenjantha.dev@gmail.com</span>
        </p>
      </div>
    </div>
  )
}
