import { AnimatePresence } from 'framer-motion'
import { useFiles } from '@/hooks/useFiles'
import { FileCard } from './FileCard'

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-zinc-800" />
        <div className="flex-1">
          <div className="h-4 w-40 bg-zinc-800 rounded" />
          <div className="h-3 w-24 bg-zinc-800 rounded mt-2" />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-zinc-400 mb-1">No files yet</h3>
      <p className="text-sm text-zinc-600 max-w-xs">
        Upload your first file to get started. All files are encrypted before leaving your device.
      </p>
    </div>
  )
}

export function FileList() {
  const { files, isLoading, error } = useFiles()

  if (error) {
    return (
      <div className="card border-red-800/30 bg-red-900/10">
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
