import { useState, useEffect, useRef } from 'react'
import { useCrypto } from '@/crypto/CryptoProvider'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { exportEncryptedPrivateKey, importEncryptedPrivateKey } from '@/crypto/backup'
import { storeKeyPair } from '@/crypto/keyStorage'
import { useToast } from '@/components/ui/Toast'
import { generateSaltBase64 } from '@/crypto/backup'
import { useTranslation, locales, type Locale } from '@/i18n'
import { motion } from 'framer-motion'

function formatFingerprint(hexString: string) {
  return hexString.substring(0, 32).match(/.{1,4}/g)?.join(':').toUpperCase() || hexString
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { keyPair, isKeysLoaded } = useCrypto()
  const { toast } = useToast()
  const { t, locale, setLocale } = useTranslation()

  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [backupPassword, setBackupPassword] = useState('')
  const [restorePassword, setRestorePassword] = useState('')
  const [isProcessingBackup, setIsProcessingBackup] = useState(false)
  const [isProcessingRestore, setIsProcessingRestore] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function calculateFingerprint() {
      if (!keyPair) return
      const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey)
      const hash = await crypto.subtle.digest('SHA-256', spki)
      const hashArray = Array.from(new Uint8Array(hash))
      const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setFingerprint(formatFingerprint(hex))
    }
    calculateFingerprint()
  }, [keyPair])

  const handleBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyPair || !user || !backupPassword) return
    setIsProcessingBackup(true)
    try {
      let salt = user.user_metadata?.backup_salt
      if (!salt) {
        salt = generateSaltBase64()
        await supabase.auth.updateUser({ data: { backup_salt: salt } })
      }
      const { encryptedPkcs8Base64, ivBase64 } = await exportEncryptedPrivateKey(keyPair.privateKey, backupPassword, salt)
      const backupData = JSON.stringify({ encryptedPrivateKey: encryptedPkcs8Base64, iv: ivBase64, version: 1, timestamp: new Date().toISOString() }, null, 2)
      const blob = new Blob([backupData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vaultshare-key-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Backup downloaded securely!', 'success')
      setBackupPassword('')
    } catch (err: any) {
      toast(err.message || 'Failed to generate backup', 'error')
    } finally {
      setIsProcessingBackup(false)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!restorePassword) {
      toast('Please enter your password first.', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setIsProcessingRestore(true)
    try {
      const text = await file.text()
      const backupData = JSON.parse(text)
      if (!backupData.encryptedPrivateKey || !backupData.iv) throw new Error('Invalid backup file format')
      const salt = user.user_metadata?.backup_salt
      if (!salt) throw new Error('No backup salt found in your account.')
      const importedPrivateKey = await importEncryptedPrivateKey(backupData.encryptedPrivateKey, backupData.iv, restorePassword, salt)
      const pubKeyBase64 = user.user_metadata?.public_key
      if (!pubKeyBase64) throw new Error('Public key missing from your account.')
      const { importPublicKey } = await import('@/crypto/keys')
      const importedPublicKey = await importPublicKey(pubKeyBase64)
      const restoredKeyPair: CryptoKeyPair = { publicKey: importedPublicKey, privateKey: importedPrivateKey }
      await storeKeyPair(user.id, restoredKeyPair)
      toast('Keys restored successfully! Refreshing...', 'success')
      setRestorePassword('')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      toast(err.message || 'Failed to restore keys.', 'error')
    } finally {
      setIsProcessingRestore(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAllFiles = async () => {
    const confirmInput = prompt('Type DELETE to confirm permanently destroying all your encrypted files.')
    if (confirmInput !== 'DELETE') return
    setIsDeleting(true)
    try {
      const { data: files } = await supabase.from('files').select('id, storage_path')
      if (files && files.length > 0) {
        const paths = files.map(f => f.storage_path)
        await supabase.storage.from('encrypted-files').remove(paths)
        const fileIds = files.map(f => f.id)
        await supabase.from('files').delete().in('id', fileIds)
      }
      toast('All files permanently deleted.', 'success')
    } catch {
      toast('Failed to delete files', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

      {/* Ambient orbs */}
      <div aria-hidden style={{
        position: 'fixed', top: 120, left: '3%', width: 320, height: 220, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,125,255,0.06) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        animation: 'sorb1 14s ease-in-out infinite',
      }} />
      <div aria-hidden style={{
        position: 'fixed', bottom: 180, right: '6%', width: 260, height: 190, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(162,89,255,0.05) 0%, transparent 70%)',
        filter: 'blur(36px)', pointerEvents: 'none', zIndex: 0,
        animation: 'sorb2 17s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes sorb1{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,-20px)}}
        @keyframes sorb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-22px,18px)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      `}</style>

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 sm:mb-10" style={{ position: 'relative', zIndex: 1 }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary mb-2 flex items-center gap-2">
          <span style={{ display: 'inline-block', width: 18, height: 1.5, background: 'linear-gradient(90deg,#007DFF,#A259FF)', borderRadius: 99 }} />
          {t.settings.subtitle}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.settings.title}</h1>
      </motion.div>

      <div className="space-y-5" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Language ── */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-brand-primary opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <h2 className="text-base font-semibold">{t.settings.language}</h2>
          </div>
          <p className="text-sm text-[var(--muted)] mb-5 ms-6">{t.settings.languageDesc}</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(locales) as Locale[]).map((code) => (
              <button
                key={code}
                onClick={() => setLocale(code)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${locale === code
                    ? 'text-white border-transparent'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--glass-bg)]'
                  }`}
                style={locale === code ? {
                  background: 'linear-gradient(135deg, #007DFF, #A259FF)',
                  boxShadow: '0 0 14px rgba(0,125,255,0.25)',
                } : {}}
              >
                {(t.nav.languages as any)[code]}
              </button>
            ))}
          </div>
        </motion.section>

        {/* ── Key Status & Fingerprint ── */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-5">
            <svg className="w-4 h-4 text-brand-primary opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h2 className="text-base font-semibold">{t.settings.encryptionKeys}</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Status icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={isKeysLoaded ? {
                background: 'rgba(0,125,255,0.08)',
                border: '1px solid rgba(0,125,255,0.15)',
                color: '#007DFF',
                boxShadow: '0 0 20px rgba(0,125,255,0.12)',
              } : {
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                color: '#f87171',
              }}
            >
              {isKeysLoaded ? (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base">
                {isKeysLoaded ? t.settings.keysActive : t.settings.keysNotFound}
              </h3>
              {fingerprint && (
                <div className="mt-2.5">
                  <p className="text-[11px] text-[var(--muted)] uppercase tracking-widest mb-1.5">{t.settings.fingerprint}</p>
                  <code
                    className="text-xs font-mono tracking-widest break-all inline-block px-3 py-2 rounded-lg"
                    style={{
                      background: 'rgba(0,125,255,0.06)',
                      border: '1px solid rgba(0,125,255,0.12)',
                      color: 'var(--brand-primary, #007DFF)',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <span style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(105deg,transparent 30%,rgba(0,125,255,0.1) 50%,transparent 70%)',
                      backgroundSize: '200% 100%', animation: 'shimmer 4s linear infinite',
                      pointerEvents: 'none',
                    }} />
                    <span style={{ position: 'relative' }}>{fingerprint}</span>
                  </code>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* ── Backup & Restore ── */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
          className="grid md:grid-cols-2 gap-5"
        >
          {/* Export */}
          <form onSubmit={handleBackup} className="card flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-brand-primary opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <h2 className="text-base font-semibold">{t.settings.exportKey}</h2>
            </div>
            <p className="text-sm text-[var(--muted)] mb-5 ms-6">{t.settings.exportDesc}</p>
            <div className="mt-auto space-y-3">
              <input type="password" placeholder={t.settings.backupPassword} required disabled={!isKeysLoaded}
                value={backupPassword} onChange={(e) => setBackupPassword(e.target.value)}
                className="input-field font-mono text-sm" />
              <button type="submit" disabled={!isKeysLoaded || isProcessingBackup}
                className="w-full font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[var(--foreground)] bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] border border-[var(--card-border)]"
              >
                {isProcessingBackup ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>{t.settings.downloadBackup}</>
                )}
              </button>
            </div>
          </form>

          {/* Restore */}
          <div className="card flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-brand-primary opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <h2 className="text-base font-semibold">{t.settings.restoreKeys}</h2>
            </div>
            <p className="text-sm text-[var(--muted)] mb-5 ms-6">{t.settings.restoreDesc}</p>
            <div className="mt-auto space-y-3">
              <input type="password" placeholder={t.settings.enterBackupPassword}
                value={restorePassword} onChange={(e) => setRestorePassword(e.target.value)}
                className="input-field font-mono text-sm" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessingRestore || !restorePassword}
                className="w-full font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[var(--foreground)] bg-[var(--btn-secondary-bg)] hover:bg-[var(--btn-secondary-hover)] border border-[var(--card-border)]"
              >
                {isProcessingRestore ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>{t.settings.selectBackupFile}</>
                )}
              </button>
              <input type="file" accept="application/json" className="hidden" ref={fileInputRef} onChange={handleRestore} />
            </div>
          </div>
        </motion.section>

        {/* ── Danger Zone ── */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-2xl p-6 sm:p-8 mt-4"
          style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-base font-semibold text-red-500 dark:text-red-400">{t.settings.dangerZone}</h2>
          </div>
          <p className="text-sm text-red-500 opacity-70 dark:text-red-400/70 mb-5 ms-6">{t.settings.dangerDesc}</p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-4 sm:p-5"
            style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}
          >
            <div>
              <h3 className="font-medium">{t.settings.deleteAllFiles}</h3>
              <p className="text-sm text-[var(--muted)] mt-0.5">{t.settings.deleteAllDesc}</p>
            </div>
            <button onClick={handleDeleteAllFiles} disabled={isDeleting}
              className="px-5 py-2.5 text-white font-medium rounded-xl transition-all disabled:opacity-50 shrink-0 active:scale-[0.97]"
              style={{
                background: isDeleting ? 'rgba(239,68,68,0.6)' : 'rgb(220,38,38)',
                boxShadow: '0 0 16px rgba(239,68,68,0.25)',
              }}
              onMouseEnter={e => !isDeleting && ((e.target as HTMLElement).style.boxShadow = '0 0 22px rgba(239,68,68,0.4)')}
              onMouseLeave={e => ((e.target as HTMLElement).style.boxShadow = '0 0 16px rgba(239,68,68,0.25)')}
            >
              {isDeleting ? t.file.deleting : t.settings.deleteAll}
            </button>
          </div>
        </motion.section>

      </div>
    </div>
  )
}