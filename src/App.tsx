import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { CryptoProvider } from '@/crypto/CryptoProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { I18nProvider } from '@/i18n'
import { Layout } from '@/components/layout/Layout'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import PublicSharePage from '@/pages/PublicSharePage'
import SettingsPage from '@/pages/SettingsPage'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { createContext, useContext, type ReactNode } from 'react'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
} | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeProps = useTheme()
  return (
    <ThemeContext.Provider value={themeProps}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useThemeContext must be used within ThemeProvider')
  return context
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AppRoutes() {
  useAuth()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          }
        />
      </Route>
      <Route path="/s/:token" element={<PublicSharePage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nProvider>
          <ThemeProvider>
            <CryptoProvider>
              <ToastProvider>
                <AppRoutes />
              </ToastProvider>
            </CryptoProvider>
          </ThemeProvider>
        </I18nProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
