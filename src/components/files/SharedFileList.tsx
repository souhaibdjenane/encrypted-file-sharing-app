import { AnimatePresence } from 'framer-motion'
import { useSharedFiles } from '@/hooks/useSharedFiles'
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

export function SharedFileList() {
  const { files, isLoading, isError } = useSharedFiles()

  if (isError) {
    return (
      <div className="card border-red-800/30 bg-red-900/10">
        <p className="text-sm text-red-400">Failed to load shared files. Please try refreshing.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-zinc-500 text-center py-8 bg-zinc-900/20 rounded-xl border border-zinc-800 border-dashed">
        No files have been shared with you yet.
      </p>
    )
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
