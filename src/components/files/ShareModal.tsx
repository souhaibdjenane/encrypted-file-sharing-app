import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShares } from '@/hooks/useShares'
import { useToast } from '@/components/ui/Toast'
import { createPortal } from 'react-dom'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

export function ShareModal({ isOpen, onClose, fileId, fileName }: ShareModalProps) {
  const { shares, isLoading, error, loadShares, shareFile, revokeShare } = useShares(fileId)
  const { toast } = useToast()

  const canDownload = true
  const canReshare = false
  const [expiresAt, setExpiresAt] = useState('')
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadShares()
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps


  const handleRevoke = async (shareId: string) => {
    try {
      await revokeShare(shareId)
      toast('Access revoked', 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to revoke access', 'error')
    }
  }

  const handleCreatePublicLink = async () => {
    try {
      const result = await shareFile({
        canDownload,
        canReshare,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      })
      
      if (result && 'publicUrl' in result && result.publicUrl) {
        setGeneratedLink(result.publicUrl as string)
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(result.publicUrl as string)
            toast('Public link copied to clipboard!', 'success')
          }
        } catch (e) {
          console.warn('Clipboard write failed, but link is displayed', e)
          toast('Link generated! You can copy it manually.', 'success')
        }
      }
    } catch (err: any) {
      console.error('Public link creation failed:', err)
      toast(err.message || 'Failed to create public link', 'error')
    }
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
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
                  <h2 className="text-lg font-semibold text-zinc-100">Share File</h2>
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
                
                {/* Public Link Section */}
                <div className="mb-6 p-5 rounded-xl border border-emerald-900/40 bg-emerald-500/5 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-400">Public Link Access</h3>
                      <p className="text-xs text-emerald-400/70 mt-1 leading-relaxed max-w-[280px]">
                        Anyone with the link can decrypt and download this file directly in their browser.
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCreatePublicLink}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Generate & Copy Link
                  </button>

                  <AnimatePresence>
                    {generatedLink && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Your Unique Link</label>
                        <div className="flex bg-zinc-950 border border-emerald-500/30 rounded-xl overflow-hidden shadow-inner ring-1 ring-emerald-500/10">
                          <input
                            type="text"
                            readOnly
                            value={generatedLink}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="bg-transparent text-emerald-300 text-xs py-3 px-4 w-full focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedLink)
                              toast('Copied!', 'success')
                            }}
                            className="px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium border-l border-emerald-500/30 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings for Public Link */}
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Expiration (Optional)</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-sm [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Existing Shares */}
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    Active Public Links
                    {isLoading && <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />}
                  </h3>
                  
                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-400 mb-4">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    {shares.length === 0 && !isLoading && !error ? (
                      <p className="text-sm text-zinc-500 text-center py-4 bg-zinc-800/20 rounded-xl border border-zinc-800 border-dashed">
                        No public links generated yet.
                      </p>
                    ) : (
                      shares.map((share) => (
                        <div
                          key={share.id}
                          className={`flex items-center justify-between p-3 rounded-xl border ${share.revoked ? 'bg-zinc-900/50 border-zinc-800/50 opacity-50' : 'bg-zinc-800/40 border-zinc-700/50'} transition-all`}
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-medium text-zinc-200 truncate flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              Public Link
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                              <span className={share.can_download ? 'text-emerald-400/80' : 'text-zinc-500'}>
                                {share.can_download ? 'Can Download' : 'View Only'}
                              </span>
                              {share.expires_at && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-400/80">
                                    Expires {new Date(share.expires_at).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                              {share.revoked && (
                                <>
                                  <span>·</span>
                                  <span className="text-red-400">Revoked</span>
                                </>
                              )}
                            </div>
                          </div>
                          {!share.revoked && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRevoke(share.id)}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 rounded-lg border border-red-800/30 transition-colors flex-shrink-0"
                              >
                                Revoke
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Use portal to render modal outside the normal DOM hierarchy
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}
