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
    <div className="relative overflow-hidden">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full animate-float-slow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,125,255,0.08) 0%, transparent 70%)' }} />
      <div className="absolute top-[100px] right-[-100px] w-[500px] h-[500px] rounded-full animate-float-slower pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(1,158,236,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full animate-float pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(2,183,223,0.06) 0%, transparent 70%)' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-brand-primary mb-8 overflow-hidden relative"
            style={{ background: 'rgba(0,125,255,0.08)', border: '1px solid rgba(0,125,255,0.2)' }}
          >
            <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,125,255,0.1), transparent)' }} />
            <svg className="w-4 h-4 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="relative z-10 font-medium">{t.landing.badge}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            <span className="text-zinc-100">{t.landing.heroTitle1}</span>
            <span className="bg-gradient-brand bg-clip-text text-transparent">{t.landing.heroTitle2}</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {t.landing.heroDescription}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-4">{t.landing.goToDashboard}</Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-lg px-8 py-4">{t.landing.getStarted}</Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4">{t.nav.logIn}</Link>
              </>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2 text-zinc-500 text-sm">
              <svg className="w-4 h-4 text-brand-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
              </svg>
              <span className="font-medium">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        <div className="mt-20 sm:mt-28 grid sm:grid-cols-3 gap-5 sm:gap-6">
          {featureCards.map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * (i + 1), duration: 0.5, ease: 'easeOut' }}
              className="card group hover:-translate-y-1 cursor-default"
            >
              <div className="w-11 h-11 flex items-center justify-center rounded-xl mb-5 transition-all duration-300 group-hover:shadow-lg"
                style={{ background: `color-mix(in srgb, ${card.color}, transparent 88%)`, color: card.color }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-2">{card.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
