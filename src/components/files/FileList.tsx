import { AnimatePresence } from 'framer-motion'
import { useFiles } from '@/hooks/useFiles'
import { FileCard } from './FileCard'

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-zinc-800/80 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-40 bg-zinc-800/80 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
          </div>
          <div className="h-3 w-28 bg-zinc-800/80 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 animate-float"
        style={{
          background: 'rgba(0,125,255,0.06)',
          border: '1px solid rgba(0,125,255,0.15)',
        }}
      >
        <svg className="w-10 h-10 text-brand-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold bg-gradient-brand bg-clip-text text-transparent mb-1.5">No files yet</h3>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
        Upload your first file to get started. All files are encrypted before leaving your device.
      </p>
    </div>
  )
}

export function FileList() {
  const { files, isLoading, error } = useFiles()

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(127,29,29,0.1)' }}>
        <p className="text-sm text-red-400">Failed to load files. Please try refreshing.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (files.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {files.map(file => (
          <FileCard key={file.id} file={file} />
        ))}
      </AnimatePresence>
    </div>
  )
}
