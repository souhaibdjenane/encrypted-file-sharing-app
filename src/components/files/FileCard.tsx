import { motion } from 'framer-motion'
import { DownloadButton } from './DownloadButton'
import { deleteFile } from '@/api/filesApi'
import { type DecryptedFile } from '@/hooks/useFiles'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n'
import { useState } from 'react'
import { ShareModal } from './ShareModal'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️'
  if (type.startsWith('video/')) return '🎬'
  if (type.startsWith('audio/')) return '🎵'
  if (type.includes('pdf')) return '📕'
  if (type.includes('zip') || type.includes('compressed') || type.includes('archive')) return '📦'
  if (type.includes('text') || type.includes('document')) return '📝'
  if (type.includes('spreadsheet') || type.includes('csv')) return '📊'
  return '📄'
}

function getFileColorClass(type: string): string {
  if (type.startsWith('image/')) return 'from-purple-500/20 to-pink-500/20 border-purple-500/20'
  if (type.startsWith('video/')) return 'from-red-500/20 to-orange-500/20 border-red-500/20'
  if (type.startsWith('audio/')) return 'from-green-500/20 to-teal-500/20 border-green-500/20'
  if (type.includes('pdf')) return 'from-red-500/20 to-rose-500/20 border-red-500/20'
  return 'from-brand-primary/20 to-brand-accent/20 border-brand-primary/20'
}

interface FileCardProps { file: DecryptedFile }

export function FileCard({ file }: FileCardProps) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this file permanently?')) return
    const queryKey = ['files', user?.id]
    const previousFiles = queryClient.getQueryData(queryKey)
    queryClient.setQueryData(queryKey, (old: any) => old?.filter((f: any) => f.id !== file.id))
    try {
      setDeleting(true)
      await deleteFile(file.id, file.storagePath)
      toast('File deleted', 'success')
      queryClient.invalidateQueries({ queryKey })
    } catch {
      toast('Failed to delete file', 'error')
      queryClient.setQueryData(queryKey, previousFiles)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      className="card group hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getFileColorClass(file.decryptedType)} border flex items-center justify-center text-lg flex-shrink-0`}>
          {getFileIcon(file.decryptedType)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">
              {file.isDecrypted ? file.name : (
                <span className="flex items-center gap-1.5 grayscale opacity-60">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t.file.encryptedFile}
                </span>
              )}
            </h3>
            {file.expiresAt && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-500/20 flex-shrink-0">
                {t.file.expires} {formatDate(file.expiresAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--muted)]">
            <span>{formatSize(file.fileSizeBytes)}</span>
            <span>·</span>
            <span>{formatDate(file.createdAt)}</span>
            {file.downloadLimit !== null && (
              <><span>·</span><span>{file.downloadCount}/{file.downloadLimit} {t.file.downloads}</span></>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex-wrap sm:flex-nowrap">
          <DownloadButton fileId={file.id} wrappedKey={file.wrappedKey} iv={file.iv} />
          <button onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-primary rounded-lg transition-all duration-200 bg-[var(--accent-glow)] border border-brand-primary/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t.file.share}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 rounded-lg transition-all duration-200 disabled:opacity-50 bg-red-500/5 border border-red-500/20"
          >
            {deleting ? (
              <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            {t.file.delete}
          </button>
        </div>
      </div>

      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)}
        fileId={file.id} fileName={file.isDecrypted ? file.name : t.file.encryptedFile} />
    </motion.div>
  )
}
