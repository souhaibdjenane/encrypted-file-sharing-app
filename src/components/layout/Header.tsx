import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { fetchUserFiles } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import logo from '@/assets/VaultShare-logo.svg'
import { AnimatePresence, motion } from 'framer-motion'

export function Header() {
  const { user } = useAuthStore()
  const { isKeysLoaded, isInitializing } = useCrypto()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      {/* Top gradient accent line */}
      <div className="h-[2px] bg-gradient-brand w-full" />

      <header className="sticky top-0 z-50 glass border-b border-zinc-800/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src={logo} alt="VaultShare Logo" className="h-8 w-auto group-hover:drop-shadow-[0_0_8px_rgba(0,125,255,0.4)] transition-all duration-300" />
              <span className="text-xl font-bold bg-gradient-brand bg-clip-text text-transparent group-hover:opacity-90 transition-all duration-300">
                VaultShare
              </span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-1 ml-8">
                <Link
                  to="/dashboard"
                  onMouseEnter={prefetchFiles}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/dashboard'
                      ? 'text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  My Files
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
                  Settings
                  {location.pathname === '/settings' && (
                    <motion.div layoutId="nav-indicator" className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-brand rounded-full" />
                  )}
                </Link>
              </div>
            )}
          </div>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                {/* Key Status */}
                <div className="flex items-center gap-1.5" title={
                  isInitializing ? 'Initializing encryption keys...' :
                  isKeysLoaded ? 'Encryption keys loaded' :
                  'Encryption keys not loaded'
                }>
                  {isInitializing ? (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className={`w-4 h-4 transition-colors duration-200 ${
                        isKeysLoaded ? 'text-brand-primary' : 'text-red-400'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
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
                  Log out
                </button>

                {/* Mobile hamburger */}
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
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-200"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm !px-4 !py-2"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile slide-down menu */}
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
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    location.pathname === '/dashboard'
                      ? 'text-white bg-brand-primary/10 border border-brand-primary/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  My Files
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                    location.pathname === '/settings'
                      ? 'text-white bg-brand-primary/10 border border-brand-primary/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                >
                  Log out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
