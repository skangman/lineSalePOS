import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useLiff } from './hooks/useLiff'
import PosIcon from './components/PosIcon'

// Redirect root → /liff/dashboard แต่เก็บ query params ไว้ด้วย (LIFF ต้องการ ?code=)
function RootRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/liff/dashboard${search}`} replace />
}

// LIFF pages
import Register from './pages/liff/Register'
import Dashboard from './pages/liff/Dashboard'
import POS from './pages/liff/POS'
import Products from './pages/liff/Products'
import ProductForm from './pages/liff/ProductForm'
import Categories from './pages/liff/Categories'
import Orders from './pages/liff/Orders'
import Debts from './pages/liff/Debts'
import OrderDetail from './pages/liff/OrderDetail'
import DailyReport from './pages/liff/DailyReport'
import Stock from './pages/liff/Stock'
// import Staff from './pages/liff/Staff' // ปิดใช้งานฟีเจอร์จัดการพนักงานชั่วคราว — แทนที่ด้วย Profile เจ้าของในหน้า Settings
import Plans from './pages/liff/Plans'
import Settings from './pages/liff/Settings'
import Profile from './pages/liff/Profile'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminShops from './pages/admin/AdminShops'
import AdminPlans from './pages/admin/AdminPlans'
import AdminUpgrades from './pages/admin/AdminUpgrades'
import AdminSettings from './pages/admin/AdminSettings'
import { AdminThemeProvider } from './context/AdminThemeContext'

function LiffGuard({ children }: { children: React.ReactNode }) {
  const { isReady, isLoggedIn, error, login } = useLiff()

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-line-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-red-500 text-lg">เกิดข้อผิดพลาด</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-line-green to-line-dark flex flex-col items-center justify-center p-6">
        <PosIcon className="w-20 h-20 mb-4" />
        <h1 className="text-white text-2xl font-bold text-center mb-2">LINE Sale POS</h1>
        <p className="text-green-100 text-center mb-8">สมัครใช้งานหรือเข้าสู่ระบบด้วยบัญชี LINE เพื่อเริ่มใช้งาน</p>
        <button
          onClick={login}
          className="bg-white text-line-green font-bold text-lg px-8 py-4 rounded-2xl shadow-lg w-full max-w-xs active:scale-95 transition-transform"
        >
          🟢 เข้าสู่ระบบด้วย LINE
        </button>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* LIFF routes */}
      <Route
        path="/liff/*"
        element={
          <LiffGuard>
            <Routes>
              <Route path="register" element={<Register />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pos" element={<POS />} />
              <Route path="products" element={<Products />} />
              <Route path="products/add" element={<ProductForm />} />
              <Route path="products/edit/:id" element={<ProductForm />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />
              <Route path="debts" element={<Debts />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="reports/daily" element={<DailyReport />} />
              <Route path="stock" element={<Stock />} />
              {/* <Route path="staff" element={<Staff />} /> ปิดใช้งานคู่กับ import ด้านบน */}
              <Route path="profile" element={<Profile />} />
              <Route path="plans" element={<Plans />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </LiffGuard>
        }
      />

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/*" element={
        <AdminThemeProvider>
          <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="shops" element={<AdminShops />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="upgrades" element={<AdminUpgrades />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </AdminThemeProvider>
      } />

      {/* Default redirect — ต้องเก็บ ?code= ไว้ให้ LIFF ประมวลผล */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
