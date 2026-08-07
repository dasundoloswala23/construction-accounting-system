import { useEffect } from 'react'
import { BrowserRouter } from 'react-router'
import { Toaster } from 'react-hot-toast'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { useThemeStore, applyThemeClass } from '@/app/providers/themeStore'
import { AppRoutes } from '@/app/routes'

function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  return (
    <QueryProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
