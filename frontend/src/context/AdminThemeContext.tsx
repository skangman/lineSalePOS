import { createContext, useContext, useState } from 'react'

export type Theme = 'dark' | 'light'

const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: 'dark',
  setTheme: () => {},
})

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem('admin_theme') as Theme) || 'dark'
  )

  const setTheme = (t: Theme) => {
    localStorage.setItem('admin_theme', t)
    setThemeState(t)
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export const useAdminTheme = () => useContext(Ctx)

// helper: c('dark-classes', 'light-classes')
export function useC() {
  const { theme } = useAdminTheme()
  return (dark: string, light: string) => (theme === 'dark' ? dark : light)
}
