export interface User {
  id: string
  line_user_id: string
  display_name: string
  picture_url: string
  is_admin: boolean
  created_at: Date
}

export interface Shop {
  id: string
  owner_id: string
  shop_name: string
  owner_name: string
  phone: string
  product_type: string
  market_area: string
  logo_url: string
  promptpay_number: string
  receipt_footer: string
  voice_enabled: boolean
  line_notify_enabled: boolean
  tax_rate: number
  service_charge_rate: number
  is_active: boolean
  plan_id: number
  created_at: Date
}

export interface ShopStaff {
  id: string
  shop_id: string
  user_id: string
  role: 'owner' | 'manager' | 'cashier'
  invite_code?: string
  joined_at: Date
  is_active: boolean
}

export interface Category {
  id: string
  shop_id: string
  name: string
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  shop_id: string
  category_id: string | null
  product_name: string
  price: number
  cost_price: number | null
  image_url: string | null
  stock_quantity: number
  is_unlimited_stock: boolean
  is_active: boolean
  sort_order: number
}

export interface CartItem {
  product_id: string
  product_name: string
  price: number
  cost_price?: number
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  shop_id: string
  user_id: string
  order_no: string
  subtotal: number
  discount: number
  tax_amount: number
  service_charge: number
  total: number
  payment_method: 'cash' | 'transfer' | 'promptpay' | 'debt'
  payment_status: 'paid' | 'unpaid' | 'cancelled'
  cash_received?: number
  change_amount?: number
  customer_name?: string
  note?: string
  cancel_reason?: string
  cancelled_at?: Date
  created_at: Date
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  price: number
  cost_price?: number
  quantity: number
  subtotal: number
}

export interface AuthRequest extends Express.Request {
  user?: User
  shopId?: string
  staffRole?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: User
      shopId?: string
      staffRole?: string
    }
  }
}
