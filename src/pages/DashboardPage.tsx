import { FileUploader } from '@/components/files/FileUploader'
import { FileList } from '@/components/files/FileList'
import { useAuthStore } from '@/store/authStore'
import { useFiles } from '@/hooks/useFiles'
import { useTranslation } from '@/i18n'
import { motion } from 'framer-motion'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { files } = useFiles()
  const { t } = useTranslation()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* Ambient background orbs */}
      <div aria-hidden style={{
        position: 'fixed', top: 100, left: '5%', width: 350, height: 250, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,125,255,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        animation: 'orb1 14s ease-in-out infinite',
      }} />
      <div aria-hidden style={{
        position: 'fixed', top: 220, right: '8%', width: 280, height: 200, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(162,89,255,0.05) 0%, transparent 70%)',
        filter: 'blur(36px)', pointerEvents: 'none', zIndex: 0,
        animation: 'orb2 18s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(35px,-25px)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-25px,20px)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 sm:mb-10"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            {/* Eyebrow */}
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary mb-2 flex items-center gap-2">
              <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'linear-gradient(90deg,#007DFF,#A259FF)', borderRadius: 99 }} />
              {t.dashboard.subtitle}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t.dashboard.welcomeBack}{user?.email ? (
                <span className="bg-gradient-brand bg-clip-text text-transparent">{`, ${user.email.split('@')[0]}`}</span>
              ) : ''}
            </h1>
          </div>

          {files && files.length > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-primary border border-brand-primary/15"
              style={{
                background: 'rgba(0,125,255,0.07)',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg,transparent 30%,rgba(0,125,255,0.12) 50%,transparent 70%)',
                backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite',
                pointerEvents: 'none',
              }} />
              <svg className="w-3.5 h-3.5 relative z-10 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="relative z-10">{t.dashboard.filesEncrypted.replace('{count}', String(files.length))}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Upload ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8 sm:mb-10"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(0,125,255,0.4), transparent)' }} />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--card-border)] bg-[var(--glass-bg)]"
            style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            <svg className="w-3 h-3 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t.dashboard.upload}
          </div>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, rgba(0,125,255,0.4), transparent)' }} />
        </div>
        <FileUploader />
      </motion.div>

      {/* ── Files ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(0,125,255,0.4), transparent)' }} />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--card-border)] bg-[var(--glass-bg)]"
            style={{ fontSize: 8, fontWeight: 400, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            <svg className="w-3 h-3 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {t.dashboard.yourFiles}
          </div>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, rgba(0,125,255,0.4), transparent)' }} />
        </div>
        <FileList />
      </motion.div>
    </div>
  )
}