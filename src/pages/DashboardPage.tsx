import { FileUploader } from '@/components/files/FileUploader'
import { FileList } from '@/components/files/FileList'
import { useAuthStore } from '@/store/authStore'
import { useFiles } from '@/hooks/useFiles'
import { useTranslation } from '@/i18n'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────────────────────────────────────
   Animated counter — counts up from 0 to target on mount
───────────────────────────────────────────────────────────────────────────── */
function CountUp({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 900
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(ease * target))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target])
  return <>{val}</>
}

/* ─────────────────────────────────────────────────────────────────────────────
   GlitchText — same as header, brief RGB split on mount + hover
───────────────────────────────────────────────────────────────────────────── */
function GlitchText({ text, className }: { text: string; className?: string }) {
  const [on, setOn] = useState(false)
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trigger = () => { setOn(true); t.current = setTimeout(() => setOn(false), 420) }
  useEffect(() => { setTimeout(trigger, 600) }, [])

  return (
    <span className={className} onMouseEnter={trigger} style={{ position: 'relative', display: 'inline-block', cursor: 'default' }}>
      {text}
      {on && (
        <>
          <span style={{
            position: 'absolute', inset: 0, clipPath: 'inset(15% 0 55% 0)', transform: 'translateX(-3px)',
            background: 'linear-gradient(90deg,#007DFF,#A259FF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'g1 .18s steps(2) infinite', opacity: .8,
          }}>{text}</span>
          <span style={{
            position: 'absolute', inset: 0, clipPath: 'inset(58% 0 12% 0)', transform: 'translateX(3px)',
            background: 'linear-gradient(90deg,#FF4D6A,#FF8C42)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'g2 .14s steps(2) infinite', opacity: .6,
          }}>{text}</span>
        </>
      )}
      <style>{`
        @keyframes g1{0%{transform:translateX(-3px)}50%{transform:translateX(4px)}100%{transform:translateX(-2px)}}
        @keyframes g2{0%{transform:translateX(3px)}50%{transform:translateX(-4px)}100%{transform:translateX(2px)}}
      `}</style>
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   StatCard — a single glowing stat tile
───────────────────────────────────────────────────────────────────────────── */
function StatCard({
  icon, label, value, accent, delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  accent: string
  delay?: number
}) {
  const [hov, setHov] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', overflow: 'hidden' }}
      className="flex-1 min-w-[130px] rounded-xl border border-[var(--card-border)] bg-[var(--glass-bg)] px-4 py-3.5 transition-all duration-300"
    >
      {/* Accent glow on hover */}
      <motion.div
        animate={{ opacity: hov ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          background: `radial-gradient(ellipse at 50% 120%, ${accent}22 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />
      {/* Corner shimmer on hover */}
      <motion.div
        animate={{ opacity: hov ? 1 : 0, x: hov ? '100%' : '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(105deg, transparent 30%, ${accent}18 50%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1">{label}</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </div>
      </div>
      {/* Bottom accent line */}
      <motion.div
        animate={{ scaleX: hov ? 1 : 0 }}
        initial={{ scaleX: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute', bottom: 0, left: 12, right: 12, height: 1.5,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          transformOrigin: 'left', borderRadius: 99,
        }}
      />
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   SectionDivider — decorative labeled separator
───────────────────────────────────────────────────────────────────────────── */
function SectionDivider({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.85 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 mb-5"
    >
      <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(0,125,255,0.4), transparent)' }} />
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--card-border)] bg-[var(--glass-bg)]"
        style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        <span style={{ color: 'var(--brand-primary, #007DFF)', display: 'flex' }}>{icon}</span>
        {label}
      </div>
      <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, rgba(0,125,255,0.4), transparent)' }} />
    </motion.div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   DashboardPage
───────────────────────────────────────────────────────────────────────────── */
export function DashboardPage() {
  const { user } = useAuthStore()
  const { files } = useFiles()
  const { t } = useTranslation()

  const username = user?.email ? user.email.split('@')[0] : null
  const fileCount = files?.length ?? 0

  // Derive simple stats
  const totalSize = files?.reduce((acc, f) => acc, 0) ?? 0
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ position: 'relative' }}>

      {/* Ambient page background orbs */}
      <div aria-hidden style={{
        position: 'fixed', top: 80, left: '5%', width: 380, height: 280, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,125,255,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        animation: 'dash-orb1 14s ease-in-out infinite',
      }} />
      <div aria-hidden style={{
        position: 'fixed', top: 200, right: '8%', width: 300, height: 220, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(162,89,255,0.05) 0%, transparent 70%)',
        filter: 'blur(36px)', pointerEvents: 'none', zIndex: 0,
        animation: 'dash-orb2 18s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes dash-orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
        @keyframes dash-orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,25px)}}
      `}</style>

      {/* ── Hero greeting ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 sm:mb-10"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div>
            {/* Subtle eyebrow */}
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-2 flex items-center gap-2"
            >
              <span style={{
                display: 'inline-block', width: 20, height: 1.5,
                background: 'linear-gradient(90deg,#007DFF,#A259FF)',
                borderRadius: 99, verticalAlign: 'middle',
              }} />
              {t.dashboard.subtitle}
            </motion.p>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {t.dashboard.welcomeBack}
              {username && (
                <>
                  {', '}
                  <GlitchText
                    text={username}
                    className="bg-gradient-brand bg-clip-text text-transparent"
                  />
                </>
              )}
            </h1>

            <p className="text-[var(--muted)] text-sm mt-2 max-w-md leading-relaxed opacity-75">
              {fileCount > 0
                ? t.dashboard.filesEncrypted.replace('{count}', String(fileCount))
                : 'Your encrypted vault is empty — upload your first file to get started.'}
            </p>
          </div>

          {/* Encryption badge */}
          {fileCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 self-start"
              style={{
                padding: '8px 14px', borderRadius: 10,
                border: '1px solid rgba(0,125,255,0.2)',
                background: 'rgba(0,125,255,0.07)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Shimmer sweep */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg,transparent 30%,rgba(0,125,255,0.12) 50%,transparent 70%)',
                backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite',
                pointerEvents: 'none',
              }} />
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
              <svg className="w-3.5 h-3.5 text-brand-primary relative z-10 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="relative z-10 text-xs font-semibold text-brand-primary">
                End-to-end encrypted
              </span>
            </motion.div>
          )}
        </div>

        {/* Stat cards row */}
        {fileCount > 0 && (
          <div className="flex flex-wrap gap-3 mt-6">
            <StatCard
              delay={0.2}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
              label="Files"
              value={<CountUp target={fileCount} />}
              accent="#007DFF"
            />
            <StatCard
              delay={0.28}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
              label="Stored"
              value={formatSize(totalSize)}
              accent="#A259FF"
            />
            <StatCard
              delay={0.36}
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              label="Security"
              value="AES-256"
              accent="#34d399"
            />
          </div>
        )}
      </motion.div>

      {/* ── Upload section ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 sm:mb-10"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <SectionDivider
          label={t.dashboard.upload}
          icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
        />
        <FileUploader />
      </motion.div>

      {/* ── Files section ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <SectionDivider
          label={t.dashboard.yourFiles}
          icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
        />
        <FileList />
      </motion.div>
    </div>
  )
}