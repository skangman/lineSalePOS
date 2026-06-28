import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getProducts, getCategories, getCurrentShop, getSettings, imgUrl } from '../../api/client'
import { useCart } from '../../hooks/useCart'
import type { Product, Category, Shop } from '../../types'
import PaymentModal from '../../components/PaymentModal'
import BottomNav from '../../components/BottomNav'

export default function POS() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [lastOrderNo, setLastOrderNo] = useState<string | null>(null)

  const { items, addItem, removeItem, updateQuantity, discount, setDiscount, clearCart, total } = useCart()

  useEffect(() => {
    Promise.all([
      getProducts({ active_only: 'true' }),
      getCategories(),
      getCurrentShop(),
      getSettings(),
    ])
      .then(([{ products }, { categories }, { shop }, { settings }]) => {
        setProducts(products)
        setCategories(categories)
        setShop(shop)
        setSettings(settings)
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = selectedCat
    ? products.filter((p) => p.category_id === selectedCat)
    : products

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center md:ml-20">
        <div className="text-center">
          <div
            className="rounded-full animate-spin mx-auto mb-3"
            style={{ width: 48, height: 48, border: '4px solid #E5E7EB', borderTopColor: '#06C755' }}
          />
          <p className="text-gray-500 text-base">กำลังโหลด POS...</p>
        </div>
      </div>
    )
  }

  /* ── Cart content (shared between desktop panel + mobile drawer) ── */
  const CartContent = () => (
    <>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-gray-300 py-12">
          <span className="text-5xl mb-2">🛒</span>
          <p className="text-sm">ยังไม่มีสินค้า</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-center gap-2 py-2.5 border-b last:border-0 px-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.product_name}</p>
                <p className="text-xs text-gray-400">{item.price.toFixed(0)} ฿</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                  className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center font-bold text-base active:bg-gray-200"
                >
                  -
                </button>
                <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                  className="w-7 h-7 bg-line-green text-white rounded-full flex items-center justify-center font-bold text-base active:bg-line-dark"
                >
                  +
                </button>
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="ml-0.5 text-red-400 active:text-red-600 text-lg"
                >
                  ✕
                </button>
              </div>
              <span className="w-14 text-right font-bold text-sm text-line-green">
                {item.subtotal.toFixed(0)} ฿
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Discount + Total + Pay */}
      <div className="border-t px-4 pt-3 pb-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm text-gray-500 shrink-0">ส่วนลด</label>
          <input
            type="number"
            value={discount || ''}
            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            className="border rounded-lg px-3 py-1.5 w-20 text-center text-sm"
            placeholder="0"
          />
          <span className="text-sm text-gray-400">฿</span>
        </div>
        <div className="flex justify-between font-bold text-base mb-3">
          <span>รวม</span>
          <span className="text-line-green">{total().toFixed(0)} ฿</span>
        </div>
        <button
          onClick={() => { setShowCart(false); setShowPayment(true) }}
          disabled={items.length === 0}
          className="w-full bg-line-green text-white font-bold text-base py-3.5 rounded-2xl active:bg-line-dark disabled:opacity-40 disabled:cursor-not-allowed hover:bg-line-dark transition-colors"
        >
          💳 รับเงิน {total().toFixed(0)} ฿
        </button>
      </div>
    </>
  )

  return (
    /* md: ใช้ h-screen + flex เพื่อให้ทั้ง 2 column อยู่ใน viewport */
    <div className="min-h-screen md:h-screen bg-gray-100 md:flex md:ml-20">

      {/* ───── Left: Products column ───── */}
      <div className="flex-1 flex flex-col md:overflow-hidden pb-40 md:pb-0">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-line-green text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div>
            <p className="text-xs text-green-100">{shop?.shop_name || 'ร้านค้า'}</p>
            <p className="font-bold text-lg">{total().toFixed(0)} ฿</p>
          </div>
          {/* Mobile: cart button — desktop shows cart in sidebar */}
          {cartCount > 0 && (
            <button
              onClick={() => setShowCart(true)}
              className="md:hidden bg-white text-line-green font-bold px-4 py-2 rounded-full flex items-center gap-2"
            >
              🛒 {cartCount} รายการ
            </button>
          )}
          {/* Desktop: item count badge */}
          {cartCount > 0 && (
            <span className="hidden md:block bg-white/20 text-white text-sm px-3 py-1 rounded-full">
              {cartCount} รายการในตะกร้า
            </span>
          )}
        </div>

        {/* Category Tabs */}
        <div className="sticky top-[60px] z-10 bg-white border-b shadow-sm">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCat(null)}
              className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                !selectedCat ? 'border-line-green text-line-green' : 'border-transparent text-gray-500'
              }`}
            >
              ทั้งหมด
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  selectedCat === c.id ? 'border-line-green text-line-green' : 'border-transparent text-gray-500'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-3">📦</span>
              <p className="text-base">ยังไม่มีสินค้า</p>
              <p className="text-sm mt-1">ไปเพิ่มสินค้าก่อนได้เลย</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => {
                const cartItem = items.find((i) => i.product_id === product.id)
                const qty = cartItem?.quantity ?? 0
                const outOfStock = !product.is_unlimited_stock && product.stock_quantity === 0

                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (outOfStock) { toast.error('สินค้าหมดแล้ว'); return }
                      const added = addItem(product)
                      if (added) toast.success(`เพิ่ม ${product.product_name}`, { duration: 800 })
                    }}
                    className={`bg-white rounded-2xl p-3 text-left shadow-sm border-2 transition-all active:scale-95 hover:shadow-md relative ${
                      qty > 0 ? 'border-line-green' : 'border-transparent'
                    } ${outOfStock ? 'opacity-50' : ''}`}
                  >
                    {product.image_url ? (
                      <img
                        src={imgUrl(product.image_url)}
                        alt={product.product_name}
                        className="w-full h-24 md:h-28 object-cover rounded-xl mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 md:h-28 bg-gray-100 rounded-xl mb-2 flex items-center justify-center text-3xl">
                        🍱
                      </div>
                    )}
                    <p className="font-semibold text-sm text-gray-800 leading-tight">{product.product_name}</p>
                    <p className="text-line-green font-bold text-base mt-1">{Number(product.price).toFixed(0)} ฿</p>
                    {!product.is_unlimited_stock && (
                      <p className="text-xs text-gray-400">เหลือ {product.stock_quantity}</p>
                    )}
                    {qty > 0 && (
                      <div className="absolute top-2 right-2 bg-line-green text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {qty}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ───── Right: Cart panel (desktop/iPad only) ───── */}
      <div className="hidden md:flex flex-col w-80 lg:w-96 bg-white border-l border-gray-100 shadow-sm">
        <div className="flex justify-between items-center px-4 py-3.5 border-b bg-gray-50">
          <h2 className="font-bold text-gray-800">ตะกร้า</h2>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-red-500 text-sm font-medium hover:text-red-600">
              ล้างทั้งหมด
            </button>
          )}
        </div>
        <CartContent />
      </div>

      {/* ───── Mobile: fixed pay button above BottomNav ───── */}
      {items.length > 0 && (
        <div className="md:hidden fixed bottom-14 left-0 right-0 px-4 py-2 z-30">
          <button
            onClick={() => setShowPayment(true)}
            className="w-full bg-line-green text-white font-bold text-xl py-4 rounded-2xl shadow-xl active:bg-line-dark"
          >
            💳 รับเงิน {total().toFixed(0)} ฿
          </button>
        </div>
      )}

      {/* Success Banner */}
      {lastOrderNo && (
        <div className="fixed top-16 md:left-24 left-4 right-4 md:right-8 bg-green-500 text-white rounded-xl px-4 py-3 z-30 shadow-lg flex justify-between items-center">
          <span>✅ {lastOrderNo}</span>
          <button onClick={() => setLastOrderNo(null)} className="text-white text-lg">✕</button>
        </div>
      )}

      {/* ───── Mobile: Cart Drawer ───── */}
      {showCart && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setShowCart(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex justify-between items-center px-4 pb-2">
              <h2 className="text-xl font-bold">ตะกร้า</h2>
              <button onClick={clearCart} className="text-red-500 text-sm font-medium">ล้างทั้งหมด</button>
            </div>
            <CartContent />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onSuccess={(orderNo) => {
            setLastOrderNo(orderNo)
            setShowPayment(false)
            toast.success(`บิล ${orderNo} สำเร็จ! ✅`, { duration: 4000 })
            getProducts({ active_only: 'true' }).then(({ products }) => setProducts(products)).catch(() => {})
          }}
          shopName={shop?.shop_name || ''}
          promptpayNumber={shop?.promptpay_number}
          voiceEnabled={shop?.voice_enabled}
          voiceTemplates={settings || {}}
        />
      )}

      {/* Nav */}
      <BottomNav />
    </div>
  )
}
