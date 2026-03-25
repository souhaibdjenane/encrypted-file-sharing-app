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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 sm:mb-10"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100">
              {t.dashboard.welcomeBack}{user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p className="text-zinc-500 text-sm mt-1.5">{t.dashboard.subtitle}</p>
          </div>
          {files && files.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-primary"
              style={{ background: 'rgba(0,125,255,0.08)', border: '1px solid rgba(0,125,255,0.15)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {t.dashboard.filesEncrypted.replace('{count}', String(files.length))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8 sm:mb-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-brand-primary/30 to-transparent" />
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t.dashboard.upload}</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-brand-primary/30 to-transparent" />
        </div>
        <FileUploader />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-brand-primary/30 to-transparent" />
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t.dashboard.yourFiles}</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-brand-primary/30 to-transparent" />
        </div>
        <FileList />
      </motion.div>
    </div>
  )
}
