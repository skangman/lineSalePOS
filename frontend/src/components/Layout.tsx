import { useNavigate, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'

interface LayoutProps {
  title: string
  children: React.ReactNode
  showBack?: boolean
  rightAction?: React.ReactNode
}

export default function Layout({ title, children, showBack = true, rightAction }: LayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const isRoot = location.pathname === '/liff/dashboard' || location.pathname === '/liff/pos'

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 md:ml-20">
      {/* Header */}
      <header className="bg-line-green text-white sticky top-0 z-30 shadow-md">
        <div className="flex items-center h-14 px-4 max-w-5xl mx-auto w-full">
          {showBack && !isRoot && (
            <button
              onClick={() => navigate(-1)}
              className="mr-3 p-1 rounded-full active:bg-line-dark"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold flex-1">{title}</h1>
          {rightAction}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-6">
        <div className="max-w-5xl mx-auto w-full">{children}</div>
      </main>

      {/* Nav */}
      <BottomNav />
    </div>
  )
}
