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
import { useThemeContext } from '@/App'

export function Header() {
  const { user } = useAuthStore()
  const { isKeysLoaded, isInitializing } = useCrypto()
  const { t, locale, setLocale } = useTranslation()
  const { theme, toggleTheme } = useThemeContext()
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
      {/* Slim iridescent top accent bar */}
      <div className="h-[1.5px] bg-gradient-brand w-full opacity-80" />

      <header className="sticky top-0 z-50 glass border-b border-[var(--header-border)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">

          {/* ── Left: Logo + Nav ── */}
          <div className="flex items-center shrink-0 gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-brand-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <img
                  src={logo}
                  alt="VaultShare Logo"
                  className="relative h-7 w-auto sm:h-8 transition-all duration-300 group-hover:scale-105"
                />
              </div>
              <span className="text-[15px] sm:text-base font-semibold tracking-tight bg-gradient-brand bg-clip-text text-transparent">
                {t.appName}
              </span>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-0.5">
                {[
                  { to: '/dashboard', label: t.nav.myFiles },
                  { to: '/settings', label: t.nav.settings },
                ].map(({ to, label }) => {
                  const active = location.pathname === to
                  return (
                    <Link
                      key={to}
                      to={to}
                      onMouseEnter={to === '/dashboard' ? prefetchFiles : undefined}
                      className={`relative px-3.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-200 ${active
                        ? 'text-[var(--foreground)]'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)]'
                        }`}
                    >
                      {label}
                      {active && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-2.5 right-2.5 h-[1.5px] bg-gradient-brand rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                    </Link>
                  )
                })}
              </nav>
            )}
          </div>

          {/* ── Right: Controls ── */}
          <div className="flex items-center gap-1 sm:gap-1.5">

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-all duration-200 hover:bg-[var(--glass-bg)]"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span className="hidden sm:inline">{locales[locale].shortName}</span>
              </button>

              <AnimatePresence>
                {langMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute top-full end-0 mt-2 py-1.5 rounded-xl glass border border-[var(--card-border)] min-w-[130px] shadow-2xl z-50 overflow-hidden"
                  >
                    {(Object.keys(locales) as Locale[]).map((code) => (
                      <button
                        key={code}
                        onClick={() => { setLocale(code); setLangMenuOpen(false) }}
                        className={`w-full text-start px-3.5 py-2 text-[13px] transition-all duration-150 flex items-center gap-2.5 ${locale === code
                          ? 'text-brand-primary bg-brand-primary/10 font-medium'
                          : 'text-[var(--foreground)] opacity-75 hover:opacity-100 hover:bg-[var(--glass-bg)]'
                          }`}
                      >
                        <span className="font-bold text-[10px] opacity-40 uppercase tracking-widest w-5 shrink-0">{locales[code].shortName}</span>
                        <span>{(t.nav.languages as any)[code]}</span>
                        {locale === code && (
                          <svg className="w-3 h-3 ms-auto text-brand-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-4 bg-[var(--header-border)] mx-0.5" />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-all duration-200 hover:bg-[var(--glass-bg)] hover:rotate-12"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 30, opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'light' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </motion.div>
              </AnimatePresence>
            </button>

            {user ? (
              <>
                {/* Divider */}
                <div className="hidden sm:block w-px h-4 bg-[var(--header-border)] mx-0.5" />

                {/* Key Status */}
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-300 ${isInitializing
                    ? 'text-amber-400 bg-amber-400/8'
                    : isKeysLoaded
                      ? 'text-emerald-400 bg-emerald-400/8'
                      : 'text-red-400 bg-red-400/8'
                    }`}
                  title={
                    isInitializing ? 'Initializing...' :
                      isKeysLoaded ? 'Keys loaded' : 'Keys not loaded'
                  }
                >
                  {isInitializing ? (
                    <div className="w-3.5 h-3.5 border-[1.5px] border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {isKeysLoaded ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 00-8 0v4h8z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      )}
                    </svg>
                  )}
                  <span className="hidden sm:inline">{isInitializing ? 'Loading' : isKeysLoaded ? 'Secured' : 'Unlocked'}</span>
                </div>

                {/* User Email — pill style */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--glass-bg)] border border-[var(--card-border)] max-w-[160px]">
                  <div className="w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-white uppercase">
                      {user.email?.[0] ?? '?'}
                    </span>
                  </div>
                  <span className="text-[12px] text-[var(--muted)] truncate">{user.email}</span>
                </div>

                {/* Logout — desktop */}
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-[13px] font-medium text-[var(--foreground)] opacity-70 hover:opacity-100 bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] border border-[var(--card-border)] rounded-lg transition-all duration-200 hover:border-red-400/30 hover:text-red-400 group"
                >
                  <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t.nav.logOut}
                </button>

                {/* Hamburger — mobile */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg transition-colors border border-[var(--card-border)] hover:bg-[var(--glass-bg)]"
                >
                  <motion.svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    animate={mobileMenuOpen ? 'open' : 'closed'}
                  >
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </motion.svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-1.5 text-[12px] sm:text-[13px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-200"
                >
                  {t.nav.logIn}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary !text-[11px] sm:!text-[13px] !px-3 sm:!px-4 !py-1.5"
                >
                  {t.nav.signUp}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <AnimatePresence>
          {mobileMenuOpen && user && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-[var(--header-border)]"
            >
              <div className="px-4 py-4 space-y-1 glass">
                {[
                  { to: '/dashboard', label: t.nav.myFiles },
                  { to: '/settings', label: t.nav.settings },
                ].map(({ to, label }) => {
                  const active = location.pathname === to
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 text-[13px] font-medium rounded-xl transition-all ${active
                        ? 'text-[var(--foreground)] bg-brand-primary/10 border border-brand-primary/20'
                        : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)]'
                        }`}
                    >
                      {active && <div className="w-1 h-1 rounded-full bg-brand-primary" />}
                      {label}
                    </Link>
                  )
                })}

                <div className="pt-2 mt-2 border-t border-[var(--header-border)] space-y-1">
                  <div className="flex items-center gap-2.5 px-4 py-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white uppercase">
                        {user.email?.[0] ?? '?'}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--muted)] opacity-70 truncate">{user.email}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-start px-4 py-3 text-[13px] font-medium text-red-400 hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-2.5"
                  >
                    <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t.nav.logOut}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}