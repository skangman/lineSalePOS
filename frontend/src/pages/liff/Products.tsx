import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getProducts, deleteProduct, toggleProduct, imgUrl } from '../../api/client'
import type { Product } from '../../types'

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    try {
      const { products } = await getProducts()
      setProducts(products)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleToggle(id: string) {
    try {
      await toggleProduct(id)
      await load()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`ลบ "${name}" ใช่ไหม?`)) return
    try {
      await deleteProduct(id)
      toast.success('ลบสินค้าแล้ว')
      await load()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="จัดการสินค้า" rightAction={
      <button onClick={() => navigate('/liff/products/add')} className="text-white font-bold text-2xl w-8 h-8 flex items-center justify-center">+</button>
    }>
      <div className="px-4 py-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาสินค้า..."
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base focus:border-line-green outline-none mb-3"
        />

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <span className="text-4xl block mb-2">📦</span>
            <p>ยังไม่มีสินค้า</p>
            <button onClick={() => navigate('/liff/products/add')} className="mt-4 bg-line-green text-white px-6 py-2 rounded-xl font-semibold">+ เพิ่มสินค้า</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm border p-3 flex gap-3 ${!p.is_active ? 'opacity-50' : ''}`}>
                {p.image_url ? (
                  <img src={imgUrl(p.image_url)} className="w-16 h-16 rounded-xl object-cover shrink-0" alt={p.product_name} />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">🍱</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{p.product_name}</p>
                  <p className="text-line-green font-bold">{Number(p.price).toFixed(0)} ฿</p>
                  {p.category_name && <p className="text-xs text-gray-400">{p.category_name}</p>}
                  {!p.is_unlimited_stock && (
                    <p className={`text-xs ${p.stock_quantity <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                      คงเหลือ {p.stock_quantity}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => navigate(`/liff/products/edit/${p.id}`)} className="text-blue-500 text-sm px-3 py-1 bg-blue-50 rounded-lg active:bg-blue-100">แก้ไข</button>
                  <button onClick={() => handleToggle(p.id)} className={`text-sm px-3 py-1 rounded-lg ${p.is_active ? 'text-yellow-600 bg-yellow-50 active:bg-yellow-100' : 'text-green-600 bg-green-50 active:bg-green-100'}`}>
                    {p.is_active ? 'ปิด' : 'เปิด'}
                  </button>
                  <button onClick={() => handleDelete(p.id, p.product_name)} className="text-red-500 text-sm px-3 py-1 bg-red-50 rounded-lg active:bg-red-100">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
