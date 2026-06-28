import axios from 'axios'

// แปลง image_url เก่า (http://localhost:3100/uploads/...) → /uploads/...
export function imgUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('/uploads/')) return url
  const match = url.match(/\/uploads\/.+/)
  return match ? match[0] : url
}

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Inject LINE auth headers from localStorage
api.interceptors.request.use((config) => {
  const lineUserId = localStorage.getItem('line_user_id')
  const displayName = localStorage.getItem('line_display_name')
  const pictureUrl = localStorage.getItem('line_picture_url')

  if (lineUserId) {
    config.headers['x-line-userid'] = lineUserId
    if (displayName) config.headers['x-line-displayname'] = displayName
    if (pictureUrl) config.headers['x-line-pictureurl'] = pictureUrl
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    const error: any = new Error(msg)
    error.status = err.response?.status
    return Promise.reject(error)
  }
)

export default api

// Auth
export const getMe = () => api.get('/auth/me').then((r) => r.data)

// Shops
export const registerShop = (data: object) => api.post('/shops/register', data).then((r) => r.data)
export const getCurrentShop = () => api.get('/shops/current').then((r) => r.data)
export const updateShop = (id: string, data: object) => api.put(`/shops/${id}`, data).then((r) => r.data)
export const getDashboard = () => api.get('/shops/dashboard').then((r) => r.data)

// Categories
export const getCategories = () => api.get('/categories').then((r) => r.data)
export const createCategory = (data: object) => api.post('/categories', data).then((r) => r.data)
export const updateCategory = (id: string, data: object) => api.put(`/categories/${id}`, data).then((r) => r.data)
export const deleteCategory = (id: string) => api.delete(`/categories/${id}`).then((r) => r.data)

// Products — pg driver returns NUMERIC as string, normalize to number here
export const getProducts = (params?: object) =>
  api.get('/products', { params }).then((r) => ({
    ...r.data,
    products: (r.data.products || []).map((p: any) => ({
      ...p,
      price: Number(p.price),
      cost_price: p.cost_price != null ? Number(p.cost_price) : null,
      stock_quantity: Number(p.stock_quantity),
    })),
  }))
export const createProduct = (data: object) => api.post('/products', data).then((r) => r.data)
export const updateProduct = (id: string, data: object) => api.put(`/products/${id}`, data).then((r) => r.data)
export const deleteProduct = (id: string) => api.delete(`/products/${id}`).then((r) => r.data)
export const toggleProduct = (id: string) => api.patch(`/products/${id}/toggle-active`).then((r) => r.data)

// Orders
export const createOrder = (data: object) => api.post('/orders', data).then((r) => r.data)
export const getOrders = (params?: object) => api.get('/orders', { params }).then((r) => r.data)
export const getOrder = (id: string) => api.get(`/orders/${id}`).then((r) => r.data)
export const cancelOrder = (id: string, reason: string) => api.post(`/orders/${id}/cancel`, { cancel_reason: reason }).then((r) => r.data)

// Reports
export const getDailyReport = (date?: string) => api.get('/reports/daily', { params: { date } }).then((r) => r.data)
export const closeShop = () => api.post('/reports/close-shop').then((r) => r.data)

// Stock
export const getStock = () => api.get('/stock').then((r) => r.data)
export const restockProduct = (data: object) => api.post('/stock/restock', data).then((r) => r.data)
export const adjustStock = (data: object) => api.post('/stock/adjust', data).then((r) => r.data)
export const getStockMovements = (params?: object) => api.get('/stock/movements', { params }).then((r) => r.data)

// Receipts
export const getReceipt = (orderId: string) => api.get(`/receipts/${orderId}`).then((r) => r.data)
export const sendReceiptLine = (orderId: string) => api.post(`/receipts/${orderId}/send-line`).then((r) => r.data)

// Staff
export const getStaff = () => api.get('/staff').then((r) => r.data)
export const inviteStaff = (data: object) => api.post('/staff/invite', data).then((r) => r.data)
export const joinShop = (invite_code: string) => api.post('/staff/join', { invite_code }).then((r) => r.data)
export const removeStaff = (id: string) => api.delete(`/staff/${id}`).then((r) => r.data)

// Settings
export const getSettings = () => api.get('/settings').then((r) => r.data)
export const updateSettings = (data: object) => api.put('/settings', data).then((r) => r.data)

// Upload
export const uploadImage = (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}
