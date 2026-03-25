import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from '@/i18n'
import { motion } from 'framer-motion'

export function LandingPage() {
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const featureCards = [
    { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: t.landing.feature1Title, description: t.landing.feature1Desc, color: 'var(--brand-primary)' },
    { icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', title: t.landing.feature2Title, description: t.landing.feature2Desc, color: 'var(--brand-secondary)' },
    { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: t.landing.feature3Title, description: t.landing.feature3Desc, color: 'var(--brand-accent)' },
  ]

  const stats = [
    { label: t.landing.statsAes, icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { label: t.landing.statsZk, icon: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' },
    { label: t.landing.statsClient, icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ]

  return (
    <>
      <style>{`
        /* ── Ambient orbs ─────────────────────────────── */
        .lp-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
          z-index: 0;
        }
        .lp-orb-1 {
          width: 600px; height: 600px;
          top: -220px; left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 14%, transparent) 0%, transparent 65%);
          animation: lp-drift1 14s ease-in-out infinite;
        }
        .lp-orb-2 {
          width: 440px; height: 440px;
          top: 60px; right: -130px;
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-secondary) 10%, transparent) 0%, transparent 65%);
          animation: lp-drift2 18s ease-in-out infinite;
        }
        .lp-orb-3 {
          width: 380px; height: 380px;
          bottom: -60px; left: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 8%, transparent) 0%, transparent 65%);
          animation: lp-drift1 22s ease-in-out infinite reverse;
        }
        @keyframes lp-drift1 {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50%       { transform: translateX(-50%) translateY(-28px); }
        }
        @keyframes lp-drift2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-18px); }
        }

        /* ── Scanline bar ─────────────────────────────── */
        .lp-scanline {
          position: absolute;
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
          opacity: 0.6;
          animation: lp-scan-pulse 4s ease-in-out infinite;
        }
        @keyframes lp-scan-pulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.7; }
        }

        /* ── Grid bg overlay ──────────────────────────── */
        .lp-root {
          position: relative;
          overflow: hidden;
        }
        .lp-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(color-mix(in srgb, var(--brand-primary) 4%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 4%, transparent) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Inner wrapper ────────────────────────────── */
        .lp-inner {
          position: relative;
          z-index: 1;
          max-width: 1140px;
          margin: 0 auto;
          padding: 80px 24px 120px;
        }

        /* ── Badge ────────────────────────────────────── */
        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--brand-primary);
          background: color-mix(in srgb, var(--brand-primary) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--brand-primary) 22%, transparent);
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
        }
        .lp-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--brand-primary) 15%, transparent), transparent);
          background-size: 200% 100%;
          animation: lp-shimmer 3s ease-in-out infinite;
        }
        @keyframes lp-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        .lp-badge > * { position: relative; z-index: 1; }

        /* ── Hero title gradient span ─────────────────── */
        .lp-title-gradient {
          background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 50%, var(--brand-accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 32px color-mix(in srgb, var(--brand-secondary) 40%, transparent));
        }

        /* ── Stats row ────────────────────────────────── */
        .lp-stats {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px 28px;
          margin-top: 48px;
        }
        .lp-stat-pill {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--brand-primary) 5%, transparent);
          border: 1px solid color-mix(in srgb, var(--brand-primary) 12%, transparent);
          color: var(--muted);
          font-size: 0.8125rem;
          transition: all 0.2s;
        }
        .lp-stat-pill:hover {
          background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
          border-color: color-mix(in srgb, var(--brand-primary) 25%, transparent);
          color: var(--foreground);
        }
        .lp-stat-pill svg {
          color: color-mix(in srgb, var(--brand-primary) 70%, transparent);
          flex-shrink: 0;
        }

        /* ── Divider ──────────────────────────────────── */
        .lp-divider {
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--brand-primary) 25%, transparent),
            color-mix(in srgb, var(--brand-secondary) 20%, transparent),
            transparent
          );
          margin: 72px 0 64px;
          position: relative;
        }
        .lp-divider::after {
          content: '';
          position: absolute;
          top: -2px; left: 50%;
          transform: translateX(-50%);
          width: 48px; height: 5px;
          border-radius: 10px;
          background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
          filter: blur(4px);
        }

        /* ── Feature cards ────────────────────────────── */
        .lp-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .lp-card {
          position: relative;
          background: color-mix(in srgb, var(--card) 90%, transparent);
          border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
          border-radius: 16px;
          padding: 32px 28px;
          cursor: default;
          transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
          backdrop-filter: blur(12px);
        }
        .lp-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 5%, transparent) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--brand-secondary) 50%, transparent),
            transparent
          );
          opacity: 0;
          transition: opacity 0.3s;
        }
        .lp-card:hover {
          transform: translateY(-5px);
          border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent);
          box-shadow: 0 20px 50px color-mix(in srgb, var(--brand-primary) 10%, transparent);
        }
        .lp-card:hover::before { opacity: 1; }
        .lp-card:hover::after  { opacity: 1; }

        .lp-card-num {
          position: absolute;
          top: 22px; right: 22px;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: color-mix(in srgb, var(--muted) 40%, transparent);
          text-transform: uppercase;
        }

        .lp-card-icon {
          width: 46px; height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          margin-bottom: 22px;
          transition: transform 0.3s;
        }
        .lp-card:hover .lp-card-icon { transform: scale(1.08); }

        .lp-card-title {
          font-size: 1.0625rem;
          font-weight: 600;
          color: var(--foreground);
          margin: 0 0 8px;
        }
        .lp-card-desc {
          font-size: 0.875rem;
          line-height: 1.65;
          color: var(--muted);
          margin: 0;
        }

        /* ── CTA buttons ──────────────────────────────── */
        .lp-cta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .lp-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.75rem;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          color: #fff;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          box-shadow: 0 4px 20px color-mix(in srgb, var(--brand-primary) 30%, transparent);
          transition: transform 0.2s, box-shadow 0.2s;
          position: relative;
          overflow: hidden;
        }
        .lp-btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--brand-secondary), var(--brand-accent));
          opacity: 0;
          transition: opacity 0.25s;
        }
        .lp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px color-mix(in srgb, var(--brand-primary) 40%, transparent);
        }
        .lp-btn-primary:hover::before { opacity: 1; }
        .lp-btn-primary > * { position: relative; z-index: 1; }

        .lp-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.75rem;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          color: var(--foreground);
          background: transparent;
          border: 1px solid var(--border);
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .lp-btn-secondary:hover {
          background: color-mix(in srgb, var(--brand-primary) 6%, transparent);
          border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent);
          transform: translateY(-2px);
        }

        @media (max-width: 640px) {
          .lp-inner { padding: 56px 20px 80px; }
          .lp-features { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-scanline" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-inner">
          {/* ── Hero ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }}
          >
            <div className="lp-badge">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>{t.landing.badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <span>{t.landing.heroTitle1}</span>
              <span className="lp-title-gradient bg-gradient-brand bg-clip-text text-transparent">{t.landing.heroTitle2}</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl opacity-70 max-w-2xl mx-auto leading-relaxed">
              {t.landing.heroDescription}
            </p>

            <div className="mt-10 lp-cta">
              {user ? (
                <Link to="/dashboard" className="lp-btn-primary">
                  <span>{t.landing.goToDashboard}</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="lp-btn-primary">
                    <span>{t.landing.getStarted}</span>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link to="/login" className="lp-btn-secondary">{t.nav.logIn}</Link>
                </>
              )}
            </div>
          </motion.div>

          {/* ── Stats row ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lp-stats"
          >
            {stats.map((stat, i) => (
              <div key={i} className="lp-stat-pill">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
                <span>{stat.label}</span>
              </div>
            ))}
          </motion.div>

          {/* ── Divider ─────────────────────────── */}
          <div className="lp-divider" />

          {/* ── Feature cards ───────────────────── */}
          <div className="lp-features">
            {featureCards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * (i + 1), duration: 0.5, ease: 'easeOut' }}
                className="lp-card"
              >
                <span className="lp-card-num">0{i + 1}</span>

                <div
                  className="lp-card-icon"
                  style={{
                    background: `color-mix(in srgb, ${card.color} 12%, transparent)`,
                    color: card.color,
                    boxShadow: `0 0 18px color-mix(in srgb, ${card.color} 20%, transparent)`,
                  }}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>

                <h3 className="lp-card-title">{card.title}</h3>
                <p className="lp-card-desc">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}