import { motion } from 'framer-motion'
import { FileCard } from '@/components/files/FileCard'
import { useSharedFiles } from '@/hooks/useSharedFiles'


export default function SharedPage() {
  const { files, isLoading, isError } = useSharedFiles()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 pt-24 sm:pt-32">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Shared with you</h1>
            <p className="text-zinc-400 mt-2 text-sm">
              Files that other users have securely shared with your account.
            </p>
          </div>
        </div>

        {/* Content State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-24 bg-zinc-900/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4 bg-red-900/20 border border-red-800/30 rounded-2xl text-red-400">
            Failed to load shared files. Please try refreshing.
          </div>
        ) : files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/20"
          >
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6 ring-1 ring-zinc-800 shadow-xl">
              <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-200 mb-2">No files shared yet</h3>
            <p className="text-zinc-500 max-w-sm">
              When someone shares a file with you, it will appear here securely encrypted.
            </p>
          </motion.div>
        ) : (
          <motion.div layout className="space-y-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}
