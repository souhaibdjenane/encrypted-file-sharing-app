import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpload, type UploadStage } from '@/hooks/useUpload'
import { useFiles } from '@/hooks/useFiles'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const stageProgress: Record<UploadStage, number> = { idle: 0, encrypting: 15, uploading: 50, saving: 90, done: 100, error: 0 }

export function FileUploader() {
  const { stage, progress, error, fileName, upload, reset } = useUpload()
  const { invalidate } = useFiles()
  const { toast } = useToast()
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const stageLabels: Record<UploadStage, string> = {
    idle: '', encrypting: t.uploader.encrypting, uploading: t.uploader.uploading,
    saving: t.uploader.saving, done: t.uploader.done, error: t.uploader.failed,
  }

  const handleFile = useCallback((file: File) => { setSelectedFile(file) }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return
    await upload(selectedFile)
  }, [selectedFile, upload])

  const prevStage = useRef(stage)
  if (prevStage.current !== stage) {
    if (stage === 'done') {
      toast(`"${fileName}" uploaded successfully`, 'success')
      invalidate()
      setTimeout(() => { reset(); setSelectedFile(null) }, 1500)
    }
    if (stage === 'error') toast(error || 'Upload failed', 'error')
    prevStage.current = stage
  }

  const isUploading = stage !== 'idle' && stage !== 'done' && stage !== 'error'
  const overallProgress = stage === 'uploading'
    ? stageProgress.encrypting + ((stageProgress.saving - stageProgress.encrypting) * progress / 100)
    : stageProgress[stage]

  return (
    <div className="card">
      <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }} onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop} onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
          isDragOver ? 'border-brand-primary' : 'border-[var(--card-border)] opacity-60 hover:opacity-100 hover:border-[var(--foreground)]'
        } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
        style={isDragOver ? { background: 'var(--accent-glow)', boxShadow: 'inset 0 0 30px rgba(0,125,255,0.05)' } : {}}
      >
        <input ref={inputRef} type="file" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = '' }} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragOver ? 'animate-pulse scale-110' : ''}`}
            style={{ background: isDragOver ? 'rgba(0,125,255,0.15)' : 'var(--glass-bg)', border: `1px solid ${isDragOver ? 'rgba(0,125,255,0.3)' : 'var(--card-border)'}` }}
          >
            <svg className={`w-6 h-6 transition-colors duration-300 ${isDragOver ? 'text-brand-primary' : 'opacity-60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm sm:text-base">{isDragOver ? t.uploader.dropHere : t.uploader.dragOrClick}</p>
            <p className="text-[var(--muted)] text-xs sm:text-sm mt-1">{t.uploader.encrypted}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedFile && stage === 'idle' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl"
              style={{ background: 'var(--glass-bg)', border: '1px solid var(--card-border)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--btn-secondary-bg)' }}>
                  <span className="text-lg">📄</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-[var(--muted)]">{formatSize(selectedFile.size)} · {selectedFile.type || 'Unknown type'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }} className="p-2 text-[var(--muted)] hover:text-red-500 transition-colors rounded-lg hover:bg-[var(--glass-bg)]">✕</button>
                <button onClick={(e) => { e.stopPropagation(); handleUpload() }} className="btn-primary text-sm !px-5 !py-2">{t.uploader.encryptUpload}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage !== 'idle' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
            <div className="p-3 rounded-xl" style={{ background: 'var(--glass-bg)', border: '1px solid var(--card-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[var(--foreground)] opacity-90 font-medium truncate me-2">{fileName}</span>
                <span className={`text-xs font-medium ${stage === 'done' ? 'text-brand-primary' : stage === 'error' ? 'text-red-400' : 'text-[var(--muted)]'}`}>{stageLabels[stage]}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--btn-secondary-bg)' }}>
                <motion.div className="h-full rounded-full relative overflow-hidden"
                  style={{ background: stage === 'error' ? '#ef4444' : 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))' }}
                  initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {stage !== 'error' && stage !== 'done' && (
                    <div className="absolute inset-0 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
                  )}
                </motion.div>
              </div>
              {stage === 'error' && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-red-500 dark:text-red-400">{error}</span>
                  <button onClick={() => { reset(); setSelectedFile(null) }} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] underline">{t.uploader.tryAgain}</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
