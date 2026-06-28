export interface User {
  id: string
  line_user_id: string
  display_name: string
  picture_url: string
  is_admin: boolean
}

export interface Shop {
  id: string
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
  plan_slug: string
  plan_name: string
  max_products: number
  max_orders_per_day: number
}

export interface Category {
  id: string
  name: string
  sort_order: number
}

export interface Product {
  id: string
  category_id: string | null
  category_name?: string
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
  quantity: number
  subtotal: number
}

export interface Order {
  id: string
  order_no: string
  subtotal: number
  discount: number
  tax_amount: number
  total: number
  payment_method: 'cash' | 'transfer' | 'promptpay' | 'debt'
  payment_status: 'paid' | 'unpaid' | 'cancelled'
  cash_received?: number
  change_amount?: number
  customer_name?: string
  item_count?: number
  created_at: string
}

export interface OrderDetail extends Order {
  items: OrderItem[]
  cancel_reason?: string
}

export interface OrderItem {
  id: string
  product_name: string
  price: number
  quantity: number
  subtotal: number
}

export interface DashboardSummary {
  total_sales: number
  total_orders: number
  cash_total: number
  transfer_total: number
  promptpay_total: number
  debt_total: number
}

export interface StockProduct extends Product {
  low_stock: boolean
}
