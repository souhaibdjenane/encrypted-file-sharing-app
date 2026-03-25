import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { fetchUserFiles } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import { useTranslation, locales, type Locale } from '@/i18n'
import logo from '@/assets/VaultShare-logo.svg'
import { AnimatePresence, motion } from 'framer-motion'

export function Header() {
  const { user } = useAuthStore()
  const { isKeysLoaded, isInitializing } = useCrypto()
  const { t, locale, setLocale } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const prefetchFiles = () => {
    if (user) {
      queryClient.prefetchQuery({ queryKey: ['files', user.id], queryFn: () => fetchUserFiles() })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMobileMenuOpen(false)
    navigate('/login')
  }

  return (
    <>
      <div className="h-[2px] bg-gradient-brand w-full" />

      <header className="sticky top-0 z-50 glass border-b border-zinc-800/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src={logo} alt="VaultShare Logo" className="h-8 w-auto group-hover:drop-shadow-[0_0_8px_rgba(0,125,255,0.4)] transition-all duration-300" />
              <span className="text-xl font-bold bg-gradient-brand bg-clip-text text-transparent group-hover:opacity-90 transition-all duration-300">
                {t.appName}
              </span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-1 ms-8">
                <Link
                  to="/dashboard"
                  onMouseEnter={prefetchFiles}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/dashboard'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {t.nav.myFiles}
                  {location.pathname === '/dashboard' && (
                    <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-brand rounded-full" />
                  )}
                </Link>
                <Link
                  to="/settings"
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/settings'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  {t.nav.settings}
                  {location.pathname === '/settings' && (
                    <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-brand rounded-full" />
                  )}
                </Link>
              </div>
            )}
          </div>

          <nav className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-lg transition-all hover:bg-zinc-800/50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                {locales[locale].nativeName}
              </button>
              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full end-0 mt-1 py-1 rounded-xl glass border border-zinc-700/40 min-w-[140px] shadow-xl z-50"
                  >
                    {(Object.keys(locales) as Locale[]).map((code) => (
                      <button
                        key={code}
                        onClick={() => { setLocale(code); setLangMenuOpen(false) }}
                        className={`w-full text-start px-4 py-2 text-sm transition-colors ${
                          locale === code
                            ? 'text-brand-primary bg-brand-primary/10'
                            : 'text-zinc-300 hover:bg-zinc-800/50'
                        }`}
                      >
                        {locales[code].nativeName}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <>
                {/* Key Status */}
                <div className="flex items-center gap-1.5" title={
                  isInitializing ? 'Initializing...' :
                  isKeysLoaded ? 'Keys loaded' : 'Keys not loaded'
                }>
                  {isInitializing ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className={`w-4 h-4 transition-colors duration-200 ${
                        isKeysLoaded ? 'text-brand-primary' : 'text-red-400'
                      }`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      {isKeysLoaded ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      )}
                    </svg>
                  )}
                </div>

                <span className="hidden sm:block text-sm text-zinc-400 max-w-[150px] truncate">
                  {user.email}
                </span>

                <button
                  onClick={handleLogout}
                  className="hidden md:block px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/40 hover:bg-zinc-700/50 border border-zinc-700/40 rounded-lg transition-all duration-200"
                >
                  {t.nav.logOut}
                </button>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200">
                  {t.nav.logIn}
                </Link>
                <Link to="/register" className="btn-primary text-sm !px-4 !py-2">
                  {t.nav.signUp}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && user && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-zinc-800/40"
            >
              <div className="px-4 py-4 space-y-2 glass">
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    location.pathname === '/dashboard'
                      ? 'text-white bg-brand-primary/10 border border-brand-primary/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >{t.nav.myFiles}</Link>
                <Link to="/settings" onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    location.pathname === '/settings'
                      ? 'text-white bg-brand-primary/10 border border-brand-primary/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >{t.nav.settings}</Link>
                <button onClick={handleLogout}
                  className="w-full text-start px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                >{t.nav.logOut}</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
