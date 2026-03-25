import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUpload, type UploadStage } from '@/hooks/useUpload'
import { useFiles } from '@/hooks/useFiles'
import { useToast } from '@/components/ui/Toast'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

const stageLabels: Record<UploadStage, string> = {
  idle: '',
  encrypting: 'Encrypting...',
  uploading: 'Uploading...',
  saving: 'Saving...',
  done: 'Done ✓',
  error: 'Failed',
}

const stageProgress: Record<UploadStage, number> = {
  idle: 0,
  encrypting: 15,
  uploading: 50,
  saving: 90,
  done: 100,
  error: 0,
}

export function FileUploader() {
  const { stage, progress, error, fileName, upload, reset } = useUpload()
  const { invalidate } = useFiles()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return
    await upload(selectedFile)
  }, [selectedFile, upload])

  // Auto-toast on done/error
  const prevStage = useRef(stage)
  if (prevStage.current !== stage) {
    if (stage === 'done') {
      toast(`"${fileName}" uploaded successfully`, 'success')
      invalidate()
      setTimeout(() => {
        reset()
        setSelectedFile(null)
      }, 1500)
    }
    if (stage === 'error') {
      toast(error || 'Upload failed', 'error')
    }
    prevStage.current = stage
  }

  const isUploading = stage !== 'idle' && stage !== 'done' && stage !== 'error'
  const overallProgress = stage === 'uploading'
    ? stageProgress.encrypting + ((stageProgress.saving - stageProgress.encrypting) * progress / 100)
    : stageProgress[stage]

  return (
    <div className="card">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragOver
            ? 'border-brand-primary bg-brand-primary/10'
            : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/30'
        } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-brand-primary/20' : 'bg-zinc-800'
          }`}>
            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">
              {isDragOver ? 'Drop file here' : 'Drag & drop a file, or click to browse'}
            </p>
            <p className="text-zinc-500 text-sm mt-1">Files are end-to-end encrypted before upload</p>
          </div>
        </div>
      </div>

      {/* Selected file preview */}
      <AnimatePresence>
        {selectedFile && stage === 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📄</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-zinc-500">{formatSize(selectedFile.size)} · {selectedFile.type || 'Unknown type'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ✕
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpload() }}
                  className="btn-primary text-sm !px-4 !py-2"
                >
                  Encrypt & Upload
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      <AnimatePresence>
        {stage !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-300 font-medium truncate mr-2">{fileName}</span>
                <span className={`text-xs font-medium ${
                  stage === 'done' ? 'text-brand-primary' : stage === 'error' ? 'text-red-400' : 'text-zinc-400'
                }`}>
                  {stageLabels[stage]}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    stage === 'error' ? 'bg-red-500' : stage === 'done' ? 'bg-brand-primary' : 'bg-brand-primary'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>

              {/* Error retry */}
              {stage === 'error' && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-red-400">{error}</span>
                  <button
                    onClick={() => { reset(); setSelectedFile(null) }}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
