import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShares } from '@/hooks/useShares'
import { useToast } from '@/components/ui/Toast'
import { createPortal } from 'react-dom'
import { useTranslation } from '@/i18n'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

export function ShareModal({ isOpen, onClose, fileId, fileName }: ShareModalProps) {
  const { shares, isLoading, error, loadShares, shareFile, revokeShare } = useShares(fileId)
  const { toast } = useToast()
  const { t } = useTranslation()

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
      toast(t.share.accessRevoked, 'success')
    } catch (err: any) {
      toast(err.message || t.share.revokeFailed, 'error')
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
            toast(t.share.linkGenerated, 'success')
          }
        } catch (e) {
          console.warn('Clipboard write failed, but link is displayed', e)
          toast(t.share.linkGeneratedManual, 'success')
        }
      }
    } catch (err: any) {
      console.error('Public link creation failed:', err)
      toast(err.message || t.share.generateFailed, 'error')
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
              className="w-full max-w-lg bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--header-border)] flex items-center justify-between sticky top-0 bg-[var(--card-bg)] z-10">
                <div>
                  <h2 className="text-lg font-semibold">{t.share.title}</h2>
                  <p className="text-sm text-[var(--muted)] truncate mt-0.5">{fileName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--glass-bg)] rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                
                {/* Public Link Section */}
                <div className="mb-6 p-5 rounded-xl border border-brand-primary/40 bg-brand-primary/5 hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-brand-primary">{t.share.publicLink}</h3>
                      <p className="text-xs text-brand-primary/70 mt-1 leading-relaxed max-w-[280px]">
                        {t.share.publicLinkDesc}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCreatePublicLink}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-brand-primary hover:bg-brand-secondary text-white px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {t.share.generateLink}
                  </button>

                  <AnimatePresence>
                    {generatedLink && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5 uppercase tracking-wider">{t.share.yourLink}</label>
                        <div className="flex bg-[var(--input-bg)] border border-brand-primary/30 rounded-xl overflow-hidden shadow-inner ring-1 ring-brand-primary/10">
                          <input
                            type="text"
                            readOnly
                            value={generatedLink}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="bg-transparent text-brand-primary text-xs py-3 px-4 w-full focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedLink)
                              toast(t.share.copied, 'success')
                            }}
                            className="px-4 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-medium border-l border-brand-primary/30 transition-colors"
                          >
                            {t.share.copy}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings for Public Link */}
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-medium opacity-80 mb-1.5">{t.share.expiration}</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full input-field font-mono text-sm [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Existing Shares */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                    {t.share.activeLinks}
                    {isLoading && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                  </h3>
                  
                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-400 mb-4">
                      {error}
                    </div>
                  )}

                  <div className="space-y-3">
                    {shares.length === 0 && !isLoading && !error ? (
                      <p className="text-sm text-[var(--muted)] text-center py-4 bg-[var(--glass-bg)] rounded-xl border border-[var(--card-border)] border-dashed">
                        {t.share.noLinks}
                      </p>
                    ) : (
                      shares.map((share) => (
                        <div
                          key={share.id}
                          className={`flex items-center justify-between p-3 rounded-xl border ${share.revoked ? 'bg-[var(--glass-bg)] opacity-50' : 'bg-[var(--card-bg)]'} border-[var(--card-border)] transition-all`}
                        >
                          <div className="min-w-0 pr-3">
                            <p className="text-sm font-medium truncate flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                              {t.share.publicLink}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--muted)]">
                              <span className={share.can_download ? 'text-brand-primary/80' : ''}>
                                {share.can_download ? t.share.canDownload : t.share.viewOnly}
                              </span>
                              {share.expires_at && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-400/80">
                                    {t.share.expiresPrefix} {new Date(share.expires_at).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                              {share.revoked && (
                                <>
                                  <span>·</span>
                                  <span className="text-red-400">{t.share.revoked}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {!share.revoked && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRevoke(share.id)}
                                className="px-3 py-1.5 text-xs font-medium text-red-500 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-colors flex-shrink-0"
                              >
                                {t.share.revoke}
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
