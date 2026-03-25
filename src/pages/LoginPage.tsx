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
    <>
      <style>{`
        /* ── Orbs ─────────────────────────────────────── */
        .login-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(72px);
          z-index: 0;
        }
        .login-orb-1 {
          width: 420px; height: 420px;
          top: -160px; left: 15%;
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 12%, transparent) 0%, transparent 65%);
          animation: login-drift1 14s ease-in-out infinite;
        }
        .login-orb-2 {
          width: 320px; height: 320px;
          bottom: -100px; right: 8%;
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 9%, transparent) 0%, transparent 65%);
          animation: login-drift2 18s ease-in-out infinite;
        }
        @keyframes login-drift1 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-24px); }
        }
        @keyframes login-drift2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }

        /* ── Scanline ─────────────────────────────────── */
        .login-scanline {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--brand-primary),
            var(--brand-secondary),
            var(--brand-primary),
            transparent
          );
          opacity: 0.5;
          animation: login-scan 4s ease-in-out infinite;
          z-index: 100;
        }
        @keyframes login-scan {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.65; }
        }

        /* ── Grid overlay ─────────────────────────────── */
        .login-root {
          position: relative;
          overflow: hidden;
        }
        .login-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Card panel ───────────────────────────────── */
        .login-panel {
          position: relative;
          z-index: 1;
          background: color-mix(in srgb, var(--card) 90%, transparent);
          border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
          border-radius: 20px;
          padding: 36px 32px;
          backdrop-filter: blur(16px);
          overflow: hidden;
        }
        /* top-edge glow line */
        .login-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--brand-primary) 50%, transparent),
            color-mix(in srgb, var(--brand-secondary) 40%, transparent),
            transparent
          );
        }
        /* subtle inner glow */
        .login-panel::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 120px;
          background: linear-gradient(
            180deg,
            color-mix(in srgb, var(--brand-primary) 4%, transparent),
            transparent
          );
          pointer-events: none;
        }

        /* ── Input fields ─────────────────────────────── */
        .login-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.9375rem;
          background: color-mix(in srgb, var(--brand-primary) 3%, var(--background));
          border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
          color: var(--foreground);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: var(--muted); opacity: 0.6; }
        .login-input:focus {
          border-color: color-mix(in srgb, var(--brand-primary) 50%, transparent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 10%, transparent);
        }

        /* ── Primary button ───────────────────────────── */
        .login-btn-primary {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 20px;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #fff;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 18px color-mix(in srgb, var(--brand-primary) 28%, transparent);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
          position: relative;
          overflow: hidden;
        }
        .login-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--brand-secondary), var(--brand-accent));
          opacity: 0;
          transition: opacity 0.25s;
        }
        .login-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--brand-primary) 38%, transparent);
        }
        .login-btn-primary:hover:not(:disabled)::before { opacity: 1; }
        .login-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .login-btn-primary > * { position: relative; z-index: 1; }

        /* ── Google button ────────────────────────────── */
        .login-btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px 20px;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--foreground);
          background: color-mix(in srgb, var(--foreground) 5%, transparent);
          border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .login-btn-google:hover {
          background: color-mix(in srgb, var(--foreground) 9%, transparent);
          border-color: color-mix(in srgb, var(--border) 100%, transparent);
          transform: translateY(-1px);
        }
        .login-btn-google:active { transform: scale(0.985); }

        /* ── Divider ──────────────────────────────────── */
        .login-divider {
          position: relative;
          margin: 24px 0;
        }
        .login-divider::before {
          content: '';
          position: absolute;
          top: 50%; left: 0; right: 0;
          height: 1px;
          background: color-mix(in srgb, var(--border) 60%, transparent);
        }
        .login-divider-label {
          position: relative;
          display: flex;
          justify-content: center;
        }
        .login-divider-label span {
          padding: 0 12px;
          font-size: 0.8125rem;
          color: var(--muted);
          background: var(--card);
        }

        /* ── Error box ────────────────────────────────── */
        .login-error {
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #f87171;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
        }
      `}</style>

      <div className="login-root min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="login-scanline" />
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">{t.auth.welcomeBack}</h1>
            <p className="mt-2 text-[var(--muted)]">{t.auth.signInSubtitle}</p>
          </div>

          {/* Panel */}
          <div className="login-panel">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="login-error">{error}</div>}

              <div>
                <label htmlFor="email" className="block text-sm font-medium opacity-80 mb-2">{t.auth.email}</label>
                <input
                  id="email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth.emailPlaceholder}
                  required className="login-input"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium opacity-80 mb-2">{t.auth.password}</label>
                <input
                  id="password" type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.passwordPlaceholder}
                  required className="login-input"
                />
              </div>

              <button type="submit" disabled={loading} className="login-btn-primary">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t.auth.signingIn}</span>
                  </>
                ) : (
                  <span>{t.auth.signIn}</span>
                )}
              </button>

              {/* Divider */}
              <div className="login-divider">
                <div className="login-divider-label">
                  <span>{t.auth.orContinueWith}</span>
                </div>
              </div>

              {/* Google */}
              <button type="button" onClick={handleGoogleLogin} className="login-btn-google">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              {t.auth.noAccount}{' '}
              <Link to="/register" className="text-brand-primary hover:text-brand-secondary font-medium transition-colors">
                {t.auth.createOne}
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  )
}