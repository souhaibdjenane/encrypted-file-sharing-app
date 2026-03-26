import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { decryptFile, decryptMetadata } from '@/crypto/decrypt'
import { useTranslation, locales, type Locale } from '@/i18n'
import logo from '@/assets/VaultShare-logo.svg'

function getHashParam(key: string) {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const value = params.get(key)
  return value
}

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>()
  const location = useLocation()
  const { t, locale, setLocale } = useTranslation()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileMeta, setFileMeta] = useState<{ id: string, name: string; type: string; size: number } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  const [fileDetails, setFileDetails] = useState<{
    storagePath: string, iv: string, encryptedMetadataUrl: string, fileKey: CryptoKey
  } | null>(null)

  useEffect(() => {
    async function init() {
      try {
        if (!token) throw new Error(t.publicShare.linkUnavailable)

        const rawKeyB64 = getHashParam('key')
        if (!rawKeyB64) throw new Error('Encryption key missing from URL.')

        const res = await fetch(`/api/get-public-share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || t.publicShare.linkUnavailable)
        }

        const data = await res.json()
        const { file, share } = data

        if (!share.can_download) throw new Error('This file is view-only.')

        const { importRawKeyBase64 } = await import('@/crypto/keys')
        const fileKey = await importRawKeyBase64(rawKeyB64)

        const metaObj = await decryptMetadata(file.encrypted_metadata.ciphertext, file.encrypted_metadata.iv, fileKey) as { name: string; type: string }

        setFileMeta({ id: file.id, name: metaObj.name, type: metaObj.type, size: file.file_size_bytes })
        setFileDetails({ storagePath: file.storage_path, iv: file.iv, encryptedMetadataUrl: '', fileKey })
      } catch (err: any) {
        setError(err.message || t.publicShare.linkUnavailable)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [token, location.hash, t.publicShare.linkUnavailable])

  const handleDownload = async () => {
    if (!fileDetails || !fileMeta) return
    setIsDownloading(true)
    setProgress(0)
    try {
      const downloadRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ token }),
      })

      if (!downloadRes.ok) throw new Error('Failed to start download')
      const { signedUrl } = await downloadRes.json()

      const fileRes = await fetch(signedUrl)
      if (!fileRes.ok) throw new Error('Failed to fetch file')

      const contentLength = fileRes.headers.get('content-length')
      const total = parseInt(contentLength || '0', 10)
      const reader = fileRes.body?.getReader()
      if (!reader) throw new Error('Stream reading not supported')

      let received = 0
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
          received += value.length
          if (total) setProgress(Math.round((received / total) * 100))
        }
      }

      const combined = new Uint8Array(received)
      let offset = 0
      for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length }

      const ivBuffer = new Uint8Array(atob(fileDetails.iv).split('').map(c => c.charCodeAt(0)))
      const plaintext = await decryptFile(combined.buffer, ivBuffer, fileDetails.fileKey)

      const blob = new Blob([plaintext], { type: fileMeta.type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = fileMeta.name
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)

      setProgress(100)
      setTimeout(() => setProgress(0), 2000)
    } catch (err: any) {
      alert(err.message || 'Download failed')
    } finally {
      setIsDownloading(false)
    }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  if (isLoading) {
    return (
      <>
        <style>{`
          .ps-root {
            position: relative;
            overflow: hidden;
          }
          .ps-root::before {
            content: '';
            position: absolute;
            inset: 0;
            background-image:
              linear-gradient(color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px),
              linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px);
            background-size: 64px 64px;
            pointer-events: none;
            z-index: 0;
          }
        `}</style>
        <div className="ps-root min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
          <div className="absolute top-[-100px] left-[30%] w-[300px] h-[300px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 10%, transparent) 0%, transparent 65%)', filter: 'blur(72px)' }} />
          <div className="w-12 h-12 rounded-full animate-spin relative z-10"
            style={{ border: '3px solid color-mix(in srgb, var(--border) 60%, transparent)', borderTopColor: 'var(--brand-primary)' }} />
          <p className="mt-4 text-[var(--muted)] text-sm font-medium relative z-10">{t.publicShare.decryptingConnection}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        /* ── Orbs ─────────────────────────────────────── */
        .ps-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(72px);
          z-index: 0;
        }
        .ps-orb-1 {
          width: 420px; height: 420px;
          top: -150px; right: 8%;
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-primary) 12%, transparent) 0%, transparent 65%);
          animation: ps-drift1 15s ease-in-out infinite;
        }
        .ps-orb-2 {
          width: 300px; height: 300px;
          bottom: -80px; left: 12%;
          background: radial-gradient(circle, color-mix(in srgb, var(--brand-accent) 9%, transparent) 0%, transparent 65%);
          animation: ps-drift2 19s ease-in-out infinite;
        }
        @keyframes ps-drift1 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-22px); }
        }
        @keyframes ps-drift2 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }

        /* ── Scanline ─────────────────────────────────── */
        .ps-scanline {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--brand-primary),
            var(--brand-secondary),
            var(--brand-primary),
            transparent
          );
          opacity: 0.5;
          animation: ps-scan 4s ease-in-out infinite;
          z-index: 100;
        }
        @keyframes ps-scan {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.65; }
        }

        /* ── Grid overlay ─────────────────────────────── */
        .ps-root {
          position: relative;
          overflow: hidden;
        }
        .ps-root::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px),
            linear-gradient(90deg, color-mix(in srgb, var(--brand-primary) 3%, transparent) 1px, transparent 1px);
          background-size: 64px 64px;
          pointer-events: none;
          z-index: 0;
        }

        /* ── Top bar ──────────────────────────────────── */
        .ps-topbar {
          position: absolute;
          top: 0; left: 0; right: 0;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 20;
        }

        /* ── Lang button ──────────────────────────────── */
        .ps-lang-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          background: color-mix(in srgb, var(--card) 80%, transparent);
          border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
          border-radius: 8px;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          backdrop-filter: blur(10px);
        }
        .ps-lang-btn:hover {
          color: var(--foreground);
          background: color-mix(in srgb, var(--card) 95%, transparent);
        }

        .ps-lang-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 120px;
          padding: 4px;
          background: color-mix(in srgb, var(--card) 95%, transparent);
          border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
          border-radius: 12px;
          backdrop-filter: blur(16px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
          z-index: 50;
          overflow: hidden;
        }
        .ps-lang-item {
          width: 100%;
          text-align: start;
          padding: 8px 12px;
          font-size: 0.6875rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          border: none;
          background: transparent;
        }
        .ps-lang-item-active {
          color: var(--brand-primary);
          background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
        }
        .ps-lang-item-inactive {
          color: var(--muted);
        }
        .ps-lang-item-inactive:hover {
          background: color-mix(in srgb, var(--foreground) 5%, transparent);
          color: var(--foreground);
        }

        /* ── Card panel ───────────────────────────────── */
        .ps-panel {
          position: relative;
          z-index: 1;
          background: color-mix(in srgb, var(--card) 90%, transparent);
          border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
          border-radius: 20px;
          padding: 40px 32px 36px;
          backdrop-filter: blur(16px);
          overflow: hidden;
        }
        .ps-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in srgb, var(--brand-primary) 50%, transparent),
            color-mix(in srgb, var(--brand-secondary) 40%, transparent),
            transparent
          );
        }
        .ps-panel::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 140px;
          background: linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 4%, transparent), transparent);
          pointer-events: none;
        }

        /* ── Icon badge ───────────────────────────────── */
        .ps-icon-badge {
          width: 64px; height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 18px;
          margin: 0 auto 28px;
          background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--brand-primary) 20%, transparent);
          box-shadow: 0 0 28px color-mix(in srgb, var(--brand-primary) 15%, transparent);
          position: relative;
          z-index: 1;
        }

        /* ── File meta row ────────────────────────────── */
        .ps-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 6px 12px;
          margin-bottom: 28px;
        }
        .ps-meta-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8125rem;
          color: var(--muted);
          background: color-mix(in srgb, var(--brand-primary) 5%, transparent);
          border: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
        }
        .ps-meta-pill-accent {
          color: var(--brand-primary);
          background: color-mix(in srgb, var(--brand-primary) 8%, transparent);
          border-color: color-mix(in srgb, var(--brand-primary) 20%, transparent);
        }

        /* ── Download button ──────────────────────────── */
        .ps-btn-download {
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px 20px;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
          border: none;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 4px 20px color-mix(in srgb, var(--brand-primary) 30%, transparent);
          transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .ps-btn-download:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px color-mix(in srgb, var(--brand-primary) 40%, transparent);
        }
        .ps-btn-download:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ── Error box ────────────────────────────────── */
        .ps-error {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #f87171;
          background: rgba(239,68,68,0.06);
          border: 1px solid rgba(239,68,68,0.2);
          text-align: center;
        }
      `}</style>

      <div className="ps-root min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--background)]">
        <div className="ps-scanline" />
        <div className="ps-orb ps-orb-1" />
        <div className="ps-orb ps-orb-2" />


        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="ps-panel max-w-md w-full"
        >
          {/* Lock icon */}
          <div className="ps-icon-badge">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-brand-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {error ? (
            <div className="text-center space-y-4 relative z-10">
              <h2 className="text-2xl font-bold">{t.publicShare.linkUnavailable}</h2>
              <p className="ps-error">{error}</p>
            </div>
          ) : fileMeta && (
            <div className="text-center relative z-10">
              <h2 className="text-xl font-bold mb-3 tracking-tight break-all">{fileMeta.name}</h2>

              <div className="ps-meta-row">
                <span className="ps-meta-pill">{formatSize(fileMeta.size)}</span>
                <span className="ps-meta-pill truncate max-w-[140px]">{fileMeta.type || 'Unknown type'}</span>
                <span className="ps-meta-pill ps-meta-pill-accent">
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t.publicShare.e2ee}
                </span>
              </div>

              <button onClick={handleDownload} disabled={isDownloading} className="ps-btn-download">
                {isDownloading ? (
                  <>
                    {/* Progress bar fill */}
                    <motion.div
                      className="absolute inset-0 origin-left"
                      style={{ background: 'color-mix(in srgb, var(--brand-secondary) 40%, transparent)' }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: progress / 100 }}
                      transition={{ ease: 'linear', duration: 0.2 }}
                    />
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                    <span className="relative z-10">
                      {t.publicShare.decryptingProgress.replace('{progress}', String(progress))}
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t.publicShare.decryptDownload}
                  </>
                )}
              </button>

              <p className="mt-4 text-xs opacity-40 leading-relaxed">{t.publicShare.footerNote}</p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}