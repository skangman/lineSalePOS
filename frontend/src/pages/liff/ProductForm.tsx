import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getCategories, createProduct, updateProduct, getProducts, uploadImage, imgUrl, getCurrentShop } from '../../api/client'
import type { Category } from '../../types'

export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [planSlug, setPlanSlug] = useState<string>('free')
  const [form, setForm] = useState({
    product_name: '',
    category_id: '',
    price: '',
    cost_price: '',
    image_url: '',
    stock_quantity: '0',
    is_unlimited_stock: false,
    sort_order: '0',
  })
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCategories().then(({ categories }) => setCategories(categories))
    getCurrentShop().then(({ shop }) => setPlanSlug(shop?.plan_slug || 'free')).catch(() => {})

    if (isEdit) {
      getProducts().then(({ products }) => {
        const p = products.find((p: any) => p.id === id)
        if (p) {
          setForm({
            product_name: p.product_name,
            category_id: p.category_id || '',
            price: String(p.price),
            cost_price: p.cost_price ? String(p.cost_price) : '',
            image_url: p.image_url || '',
            stock_quantity: String(p.stock_quantity),
            is_unlimited_stock: p.is_unlimited_stock,
            sort_order: String(p.sort_order),
          })
        }
      })
    }
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์ใหญ่เกิน 5MB')
      return
    }

    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      setForm((f) => ({ ...f, image_url: url }))
      toast.success('อัปโหลดรูปสำเร็จ')
    } catch (err: any) {
      toast.error(err.message || 'อัปโหลดไม่สำเร็จ')
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveImage() {
    setForm((f) => ({ ...f, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_name || !form.price) {
      toast.error('กรุณากรอกชื่อสินค้าและราคา')
      return
    }

    setLoading(true)
    try {
      const data = {
        ...form,
        price: Number(form.price),
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        stock_quantity: Number(form.stock_quantity),
        sort_order: Number(form.sort_order),
        category_id: form.category_id || null,
      }

      if (isEdit) {
        await updateProduct(id, data)
        toast.success('แก้ไขสินค้าแล้ว')
      } else {
        await createProduct(data)
        toast.success('เพิ่มสินค้าแล้ว')
      }
      navigate('/liff/products')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title={isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}>
      <div className="px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">รูปสินค้า</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            {form.image_url ? (
              <div className="relative w-full">
                <img
                  src={imgUrl(form.image_url)}
                  alt="preview"
                  className="w-full h-48 object-cover rounded-2xl border-2 border-gray-200"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-black/50 text-white text-sm px-3 py-1.5 rounded-lg backdrop-blur"
                  >
                    เปลี่ยนรูป
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-500/80 text-white text-sm px-3 py-1.5 rounded-lg"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 active:bg-gray-50 disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <div className="w-8 h-8 border-3 border-line-green border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">กำลังอัปโหลด...</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">📷</span>
                    <span className="text-sm font-medium">แตะเพื่อเลือกรูป</span>
                    <span className="text-xs">JPG, PNG ไม่เกิน 5MB</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อสินค้า *</label>
            <input
              name="product_name"
              value={form.product_name}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
              placeholder="ชื่อสินค้า"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">หมวดหมู่</label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none bg-white"
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ราคาขาย *</label>
              <div className="relative">
                <input
                  name="price"
                  type="number"
                  inputMode="decimal"
                  value={form.price}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl pl-4 pr-8 py-3 text-base focus:border-line-green outline-none"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">ราคาทุน</label>
              <div className="relative">
                <input
                  name="cost_price"
                  type="number"
                  inputMode="decimal"
                  value={form.cost_price}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 rounded-xl pl-4 pr-8 py-3 text-base focus:border-line-green outline-none"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">฿</span>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <input
                type="checkbox"
                name="is_unlimited_stock"
                checked={form.is_unlimited_stock}
                onChange={handleChange}
                className="w-5 h-5 accent-line-green"
              />
              <div>
                <span className="font-semibold text-gray-700">ไม่จำกัดสต๊อก</span>
                <p className="text-xs text-gray-400">เหมาะกับสินค้าที่ไม่ต้องนับจำนวน</p>
              </div>
            </label>

            {!form.is_unlimited_stock && (
              isEdit && planSlug === 'free' ? (
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3 opacity-60">
                  <span>🔒</span>
                  <p className="text-sm text-gray-500">แก้ไขสต็อกได้เฉพาะ Pro ขึ้นไป</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">จำนวนสต๊อก</label>
                  <input
                    name="stock_quantity"
                    type="number"
                    inputMode="numeric"
                    value={form.stock_quantity}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none bg-white"
                    placeholder="0"
                  />
                </div>
              )
            )}
          </div>

          {/* Sort order */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ลำดับแสดงผล</label>
            <input
              name="sort_order"
              type="number"
              inputMode="numeric"
              value={form.sort_order}
              onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base focus:border-line-green outline-none"
              placeholder="0"
            />
            <p className="text-xs text-gray-400 mt-1">น้อย = แสดงก่อน</p>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-line-green text-white font-bold text-lg py-4 rounded-xl active:bg-line-dark disabled:opacity-60 shadow-md"
          >
            {loading ? 'กำลังบันทึก...' : isEdit ? '✅ บันทึกการแก้ไข' : '✅ เพิ่มสินค้า'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
