import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchFileAuditLogs, type AuditLog } from '@/api/filesApi'
import { createPortal } from 'react-dom'

interface AuditLogViewerProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

export function AuditLogViewer({ isOpen, onClose, fileId, fileName }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadLogs()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchFileAuditLogs(fileId)
      setLogs(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs')
    } finally {
      setIsLoading(false)
    }
  }

  const getActionInfo = (action: string) => {
    switch (action) {
      case 'upload':
        return { label: 'Uploaded', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
      case 'download':
        return { label: 'Downloaded', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', color: 'text-blue-400', bg: 'bg-blue-400/10' }
      case 'share':
        return { label: 'Shared', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', color: 'text-purple-400', bg: 'bg-purple-400/10' }
      case 'revoke':
        return { label: 'Revoked Access', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', color: 'text-red-400', bg: 'bg-red-400/10' }
      default:
        return { label: action, icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-zinc-400', bg: 'bg-zinc-400/10' }
    }
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Activity Log</h2>
                <p className="text-sm text-zinc-500 truncate mt-0.5">{fileName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {error && (
                <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-400 mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4 bg-zinc-800/20 rounded-xl border border-zinc-800 border-dashed">
                    No activity recorded yet.
                  </p>
                ) : (
                  <div className="relative border-l-2 border-zinc-800 ml-3 pl-5 space-y-6 py-2">
                    {logs.map((log) => {
                      const { label, icon, color, bg } = getActionInfo(log.action)
                      return (
                        <div key={log.id} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[29px] w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-zinc-900 ${bg}`}>
                            <svg className={`w-3.5 h-3.5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                            </svg>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium text-zinc-200">
                              {label}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 mb-2">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                            
                            {/* Metadata Display */}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div className="bg-zinc-950 rounded-lg p-3 text-xs text-zinc-400 font-mono flex flex-col gap-1 border border-zinc-800/50">
                                {Object.entries(log.metadata).map(([key, value]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="text-zinc-500">{key}:</span>
                                    <span className="text-zinc-300 truncate">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
