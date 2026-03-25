import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export function LandingPage() {
  const { user } = useAuthStore()

  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-0 w-[400px] h-[400px] bg-brand-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-sm text-brand-primary mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            End-to-end encrypted
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="text-zinc-100">Share files with </span>
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              zero-knowledge privacy
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Your files are encrypted before they leave your device. Only you and your
            recipients hold the keys — not even VaultShare can read your data.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-4">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-4">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-24 sm:mt-32 grid sm:grid-cols-3 gap-6">
          <div className="card group hover:border-brand-primary/30 transition-colors duration-300">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary mb-4 group-hover:bg-brand-primary/20 transition-colors duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Client-Side Encryption</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Files are encrypted with AES-256-GCM directly in your browser before upload. Your encryption keys never leave your device.
            </p>
          </div>

          <div className="card group hover:border-emerald-500/30 transition-colors duration-300">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 mb-4 group-hover:bg-teal-500/20 transition-colors duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Secure Sharing</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Generate time-limited, password-protected share links. Recipients decrypt files locally with the shared key.
            </p>
          </div>

          <div className="card group hover:border-emerald-500/30 transition-colors duration-300">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:bg-cyan-500/20 transition-colors duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Zero-Knowledge Architecture</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Our servers store only encrypted blobs. No metadata logging, no access to plaintext — your privacy is mathematically guaranteed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
