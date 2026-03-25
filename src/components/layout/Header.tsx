import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { fetchUserFiles } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import logo from '@/assets/VaultShare-logo.svg'

export function Header() {
  const { user } = useAuthStore()
  const { isKeysLoaded, isInitializing } = useCrypto()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const prefetchFiles = () => {
    if (user) {
      queryClient.prefetchQuery({ queryKey: ['files', user.id], queryFn: () => fetchUserFiles() })
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="VaultShare Logo" className="h-8 w-auto group-hover:opacity-80 transition-opacity" />
            <span className="text-xl font-bold bg-gradient-brand bg-clip-text text-transparent group-hover:opacity-80 transition-all duration-300">
              VaultShare
            </span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-1 ml-6 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
              <Link
                to="/dashboard"
                onMouseEnter={prefetchFiles}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  location.pathname === '/dashboard'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                My Files
              </Link>
              <Link
                to="/settings"
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  location.pathname === '/settings'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                Settings
              </Link>
            </div>
          )}
        </div>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              {/* Key Status Indicator */}
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

              <span className="hidden sm:block text-sm text-zinc-400">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 rounded-lg transition-all duration-200"
              >
                Log out
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
                className="px-4 py-2 text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-primary/20"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
