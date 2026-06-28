import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/client'
import { useC } from '../context/AdminThemeContext'

const NAV = [
  { path: '/admin/dashboard', label: 'หน้าหลัก' },
  { path: '/admin/shops', label: 'ร้านค้า' },
  { path: '/admin/plans', label: 'แพ็คเกจ' },
  { path: '/admin/upgrades', label: 'อัปเกรด' },
  { path: '/admin/settings', label: 'ตั้งค่า' },
]

export default function AdminLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const c = useC()
  const [pending, setPending] = useState(0)

  useEffect(() => {
    function check() {
      api.get('/admin/upgrades').then((r) => {
        setPending(r.data.requests?.length ?? 0)
      }).catch(() => {})
    }
    check()
    const t = setInterval(check, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={`min-h-screen ${c('bg-zinc-900 text-white', 'bg-gray-50 text-gray-900')}`}>

      {/* Desktop/iPad: left sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 bottom-0 w-48 flex-col z-40 border-r ${c('bg-zinc-950 border-zinc-800', 'bg-white border-gray-100')} shadow-sm`}>
        {/* Brand */}
        <div className={`h-14 flex items-center px-5 border-b shrink-0 ${c('border-zinc-800', 'border-gray-100')}`}>
          <span className="font-bold text-sm">LINE Sale POS</span>
          <span className={`ml-1 font-normal text-xs ${c('text-zinc-500', 'text-gray-400')}`}>/admin</span>
        </div>
        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((n) => {
            const active = pathname === n.path
            return (
              <button
                key={n.path}
                onClick={() => navigate(n.path)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
                  active
                    ? c('bg-zinc-800 text-white', 'bg-green-50 text-line-green')
                    : c('text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100', 'text-gray-500 hover:bg-gray-50 hover:text-gray-800')
                }`}
              >
                {n.label}
                {n.path === '/admin/upgrades' && pending > 0 && (
                  <span className="ml-auto bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {pending}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main content area (offset for sidebar on desktop) */}
      <div className={`md:ml-48 flex flex-col min-h-screen pb-16 md:pb-0`}>

        {/* Top bar */}
        <header className={`sticky top-0 z-30 h-12 flex items-center px-5 border-b ${c('bg-zinc-900 border-zinc-800', 'bg-white border-gray-100')}`}>
          <button onClick={() => navigate('/admin/dashboard')} className="font-bold text-sm">
            <span className="md:hidden">LINE Sale POS <span className={c('text-zinc-600', 'text-gray-400') + ' font-normal'}> / admin</span></span>
            <span className="hidden md:inline">{title || 'LINE Sale POS'}</span>
          </button>
          {/* Pending badge in header on mobile */}
          {pending > 0 && (
            <button
              onClick={() => navigate('/admin/upgrades')}
              className="ml-auto flex items-center gap-1.5 bg-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full"
            >
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
              {pending} คำขอ
            </button>
          )}
        </header>

        {title && (
          <div className="px-5 pt-5 pb-1 md:hidden">
            <h1 className="text-lg font-bold">{title}</h1>
          </div>
        )}

        <main className="flex-1 px-4 py-4 max-w-5xl mx-auto w-full">
          {children}
        </main>

        {/* Mobile: bottom nav */}
        <nav className={`md:hidden fixed bottom-0 inset-x-0 z-40 h-14 flex border-t ${c('bg-zinc-900 border-zinc-800', 'bg-white border-gray-100')}`}>
          {NAV.map((n) => {
            const active = pathname === n.path
            return (
              <button
                key={n.path}
                onClick={() => navigate(n.path)}
                className={`flex-1 flex items-center justify-center text-xs font-medium relative transition-colors ${
                  active ? c('text-white', 'text-gray-900') : c('text-zinc-500', 'text-gray-400')
                }`}
              >
                {active && <span className={`absolute top-0 inset-x-4 h-0.5 rounded-b-full ${c('bg-white', 'bg-gray-900')}`} />}
                {n.label}
                {n.path === '/admin/upgrades' && pending > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {pending}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
