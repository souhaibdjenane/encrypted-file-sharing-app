import { AnimatePresence } from 'framer-motion'
import { useFiles } from '@/hooks/useFiles'
import { useTranslation } from '@/i18n'
import { FileCard } from './FileCard'

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[var(--card-border)] relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[var(--foreground)] opacity-5 to-transparent" />
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-40 bg-[var(--card-border)] rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[var(--foreground)] opacity-5 to-transparent" />
          </div>
          <div className="h-3 w-28 bg-[var(--card-border)] rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[var(--foreground)] opacity-5 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function FileList() {
  const { files, isLoading, error } = useFiles()
  const { t } = useTranslation()

  if (error) {
    return (
      <div className="card !border-red-500/20 !bg-red-500/5">
        <p className="text-sm text-red-500 dark:text-red-400">{t.fileList.loadError}</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 animate-float bg-[var(--accent-glow)] border border-brand-primary/15"
        >
          <svg className="w-10 h-10 text-brand-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold bg-gradient-brand bg-clip-text text-transparent mb-1.5">{t.fileList.noFiles}</h3>
        <p className="text-sm text-[var(--muted)] max-w-xs leading-relaxed">{t.fileList.noFilesDesc}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {files.map(file => <FileCard key={file.id} file={file} />)}
      </AnimatePresence>
    </div>
  )
}
