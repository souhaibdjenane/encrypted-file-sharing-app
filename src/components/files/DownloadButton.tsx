import { useDownload } from '@/hooks/useDownload'

interface DownloadButtonProps {
  fileId: string
  wrappedKey: string
  iv: string
}

export function DownloadButton({ fileId, wrappedKey, iv }: DownloadButtonProps) {
  const { stage, error, download } = useDownload()

  const isWorking = stage !== 'idle' && stage !== 'done' && stage !== 'error'

  const label = {
    idle: 'Download',
    preparing: 'Preparing...',
    downloading: 'Downloading...',
    decrypting: 'Decrypting...',
    done: 'Done ✓',
    error: 'Retry',
  }[stage]

  return (
    <div className="relative">
      <button
        onClick={() => download(fileId, wrappedKey, iv)}
        disabled={isWorking}
        title={error || undefined}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
        style={{
          background: stage === 'error'
            ? 'rgba(239,68,68,0.1)'
            : stage === 'done'
            ? 'var(--accent-glow)'
            : 'var(--btn-secondary-bg)',
          border: `1px solid ${
            stage === 'error'
              ? 'rgba(239,68,68,0.3)'
              : stage === 'done'
              ? 'rgba(0,125,255,0.2)'
              : 'var(--card-border)'
          }`,
          color: stage === 'error'
            ? '#ef4444'
            : stage === 'done'
            ? 'var(--brand-primary)'
            : 'var(--foreground)',
        }}
      >
        {isWorking ? (
          <div className="w-3 h-3 border-2 border-[var(--muted)] border-t-brand-primary rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        )}
        {label}
      </button>
    </div>
  )
}
