import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { decryptFile, decryptMetadata } from '@/crypto/decrypt'

function getHashParam(key: string) {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const value = params.get(key)
  return value
}

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>()
  const location = useLocation()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileMeta, setFileMeta] = useState<{ id: string, name: string; type: string; size: number } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState(0)

  const [fileDetails, setFileDetails] = useState<{
    storagePath: string, iv: string, encryptedMetadataUrl: string, fileKey: CryptoKey
  } | null>(null)

  useEffect(() => {
    async function init() {
      try {
        if (!token) throw new Error('Invalid share link')

        const rawKeyB64 = getHashParam('key')
        if (!rawKeyB64) {
          throw new Error('Encryption key missing from URL. The link might be malformed.')
        }

        const res = await fetch(`/api/get-public-share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Share link is invalid or has expired.')
        }

        const data = await res.json()
        const { file, share } = data

        if (!share.can_download) {
          throw new Error('This file is view-only, but the viewer is not implemented yet.')
        }

        const { importRawKeyBase64 } = await import('@/crypto/keys')
        const fileKey = await importRawKeyBase64(rawKeyB64)

        const metaObj = await decryptMetadata(file.encrypted_metadata.ciphertext, file.encrypted_metadata.iv, fileKey) as { name: string; type: string }

        setFileMeta({
          id: file.id,
          name: metaObj.name,
          type: metaObj.type,
          size: file.file_size_bytes,
        })

        setFileDetails({
          storagePath: file.storage_path,
          iv: file.iv,
          encryptedMetadataUrl: '',
          fileKey,
        })
      } catch (err: any) {
        setError(err.message || 'Failed to open shared file')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [token, location.hash])

  const handleDownload = async () => {
    if (!fileDetails || !fileMeta) return
    setIsDownloading(true)
    setProgress(0)
    try {
      const downloadRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
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
      for (const chunk of chunks) {
        combined.set(chunk, offset)
        offset += chunk.length
      }

      const ivBuffer = new Uint8Array(atob(fileDetails.iv).split('').map(c => c.charCodeAt(0)))
      const plaintext = await decryptFile(combined.buffer, ivBuffer, fileDetails.fileKey)

      const blob = new Blob([plaintext], { type: fileMeta.type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileMeta.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

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
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-[-100px] left-[30%] w-[300px] h-[300px] rounded-full animate-float-slow pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,125,255,0.06) 0%, transparent 70%)' }} />
        <div className="w-12 h-12 rounded-full animate-spin relative z-10"
          style={{ border: '3px solid rgba(63,63,70,0.3)', borderTopColor: 'var(--brand-primary)' }} />
        <p className="mt-4 text-zinc-400 font-medium relative z-10">Decrypting connection...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-150px] right-[10%] w-[400px] h-[400px] rounded-full animate-float-slow pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,125,255,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-100px] left-[15%] w-[300px] h-[300px] rounded-full animate-float-slower pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(2,183,223,0.05) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full card relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"
          style={{ background: 'rgba(0,125,255,0.08)' }} />

        <div className="flex justify-center mb-8 relative z-10">
          <div className="p-4 rounded-2xl"
            style={{
              background: 'rgba(0,125,255,0.08)',
              border: '1px solid rgba(0,125,255,0.15)',
            }}
          >
            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {error ? (
          <div className="text-center space-y-4 relative z-10">
            <h2 className="text-2xl font-bold text-white">Link Unavailable</h2>
            <p className="text-red-400 text-sm px-4 py-3 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              {error}
            </p>
          </div>
        ) : fileMeta && (
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight break-all">
              {fileMeta.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 text-zinc-400 text-sm mb-8">
              <span>{formatSize(fileMeta.size)}</span>
              <span>•</span>
              <span className="truncate max-w-[150px]">{fileMeta.type || 'Unknown Type'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-brand-primary/80">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                E2EE
              </span>
            </div>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full relative font-bold py-3.5 px-6 rounded-xl transition-all duration-300 text-white disabled:opacity-50 overflow-hidden flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
                boxShadow: '0 0 20px rgba(0,125,255,0.2)',
              }}
            >
              {isDownloading ? (
                <div className="absolute inset-0" style={{ background: 'rgba(0,125,255,0.2)' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: 'rgba(2,183,223,0.3)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.2 }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-white gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Decrypting ({progress}%)
                  </span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Decrypt & Download
                </>
              )}
            </button>
            <p className="mt-4 text-xs text-zinc-600">
              Decryption happens entirely in your browser. VaultShare cannot read this file.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
