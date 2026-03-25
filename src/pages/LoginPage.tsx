import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '@/i18n'
import { motion } from 'framer-motion'

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) } else { navigate('/dashboard') }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-150px] left-[20%] w-[400px] h-[400px] rounded-full animate-float-slow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,125,255,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-100px] right-[10%] w-[300px] h-[300px] rounded-full animate-float-slower pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(2,183,223,0.05) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">{t.auth.welcomeBack}</h1>
          <p className="mt-2 text-zinc-400">{t.auth.signInSubtitle}</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">{t.auth.email}</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.auth.emailPlaceholder} required className="input-field" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">{t.auth.password}</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.auth.passwordPlaceholder} required className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
              {loading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.auth.signingIn}</>) : t.auth.signIn}
            </button>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800/60"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-3 text-zinc-500" style={{ background: 'rgba(24,24,27,0.6)' }}>{t.auth.orContinueWith}</span></div>
            </div>
            <button type="button" onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-200 hover:shadow-lg hover:shadow-white/5 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            {t.auth.noAccount}{' '}<Link to="/register" className="text-brand-primary hover:text-brand-secondary font-medium transition-colors">{t.auth.createOne}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
