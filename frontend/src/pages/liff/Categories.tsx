import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../../components/Layout'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/client'
import type { Category } from '../../types'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const { categories } = await getCategories()
    setCategories(categories)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!name.trim()) return toast.error('กรุณากรอกชื่อหมวดหมู่')
    try {
      if (editId) {
        await updateCategory(editId, { name })
        toast.success('แก้ไขแล้ว')
        setEditId(null)
      } else {
        await createCategory({ name, sort_order: categories.length })
        toast.success('เพิ่มหมวดหมู่แล้ว')
      }
      setName('')
      await load()
    } catch (err: any) { toast.error(err.message) }
  }

  async function handleDelete(id: string, n: string) {
    if (!confirm(`ลบหมวด "${n}"?`)) return
    try { await deleteCategory(id); toast.success('ลบแล้ว'); await load() }
    catch (err: any) { toast.error(err.message) }
  }

  return (
    <Layout title="จัดการหมวดหมู่">
      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">{editId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h2>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อหมวดหมู่"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-base focus:border-line-green outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button onClick={handleSave} className="bg-line-green text-white px-4 py-2.5 rounded-xl font-bold active:bg-line-dark">{editId ? 'บันทึก' : '+ เพิ่ม'}</button>
            {editId && <button onClick={() => { setEditId(null); setName('') }} className="bg-gray-100 px-4 py-2.5 rounded-xl text-gray-600">ยกเลิก</button>}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-line-green border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
                <span className="font-medium text-gray-800">{c.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(c.id); setName(c.name) }} className="text-blue-500 text-sm px-3 py-1 bg-blue-50 rounded-lg">แก้ไข</button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="text-red-500 text-sm px-3 py-1 bg-red-50 rounded-lg">ลบ</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
