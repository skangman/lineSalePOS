import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import type { CartItem, Product } from '../types'

interface CartStore {
  items: CartItem[]
  discount: number
  addItem: (product: Product) => boolean
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number, maxStock?: number | null) => void
  setDiscount: (discount: number) => void
  clearCart: () => void
  subtotal: () => number
  total: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,

      addItem: (product) => {
        const price = Number(product.price)
        const items = get().items
        const existing = items.find((i) => i.product_id === product.id)
        const currentQty = existing?.quantity ?? 0

        // เช็คสต็อก (ถ้าไม่ได้ตั้ง unlimited)
        if (!product.is_unlimited_stock && product.stock_quantity != null) {
          if (currentQty >= Number(product.stock_quantity)) {
            toast.error(`${product.product_name} มีสต็อกเหลือ ${product.stock_quantity} ชิ้นเท่านั้น`, { id: 'stock-limit' })
            return false
          }
        }

        if (existing) {
          set({
            items: items.map((i) =>
              i.product_id === product.id
                ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                product_id: product.id,
                product_name: product.product_name,
                price,
                quantity: 1,
                subtotal: price,
              },
            ],
          })
        }
        return true
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product_id !== productId) })
      },

      updateQuantity: (productId, quantity, maxStock) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        const capped = maxStock != null ? Math.min(quantity, maxStock) : quantity
        set({
          items: get().items.map((i) =>
            i.product_id === productId
              ? { ...i, quantity: capped, subtotal: capped * i.price }
              : i
          ),
        })
      },

      setDiscount: (discount) => set({ discount }),

      clearCart: () => set({ items: [], discount: 0 }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
      total: () => {
        const sub = get().subtotal()
        return Math.max(0, sub - get().discount)
      },
    }),
    {
      name: 'pos-cart',
      merge: (persisted: any, current) => ({
        ...current,
        items: Array.isArray(persisted?.items) ? persisted.items : [],
        discount: typeof persisted?.discount === 'number' ? persisted.discount : 0,
      }),
    }
  )
)
