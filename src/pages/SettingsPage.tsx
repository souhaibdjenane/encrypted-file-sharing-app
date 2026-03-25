import { useState, useEffect, useRef } from 'react'
import { useCrypto } from '@/crypto/CryptoProvider'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { exportEncryptedPrivateKey, importEncryptedPrivateKey } from '@/crypto/backup'
import { storeKeyPair } from '@/crypto/keyStorage'
import { useToast } from '@/components/ui/Toast'
import { generateSaltBase64 } from '@/crypto/backup'

function formatFingerprint(hexString: string) {
  return hexString.substring(0, 32).match(/.{1,4}/g)?.join(':').toUpperCase() || hexString
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { keyPair, isKeysLoaded } = useCrypto()
  const { toast } = useToast()
  
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
      // Get the user's salt from metadata. If they are an older user without one, generate it now and save it.
      let salt = user.user_metadata?.backup_salt
      if (!salt) {
        salt = generateSaltBase64()
        await supabase.auth.updateUser({ data: { backup_salt: salt } })
      }

      const { encryptedPkcs8Base64, ivBase64 } = await exportEncryptedPrivateKey(
        keyPair.privateKey,
        backupPassword,
        salt
      )

      const backupData = JSON.stringify({
        encryptedPrivateKey: encryptedPkcs8Base64,
        iv: ivBase64,
        version: 1,
        timestamp: new Date().toISOString()
      }, null, 2)

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
      toast('Please enter your password first before selecting the backup file.', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsProcessingRestore(true)
    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      if (!backupData.encryptedPrivateKey || !backupData.iv) {
        throw new Error('Invalid backup file format')
      }

      const salt = user.user_metadata?.backup_salt
      if (!salt) {
        throw new Error('No backup salt found in your account. Cannot restore.')
      }

      const importedPrivateKey = await importEncryptedPrivateKey(
        backupData.encryptedPrivateKey,
        backupData.iv,
        restorePassword,
        salt
      )

      // We have successfuly recovered the private key!
      // But we need the public key to reform the KeyPair.
      // We can get it from Supabase metadata.
      const pubKeyBase64 = user.user_metadata?.public_key
      if (!pubKeyBase64) throw new Error('Public key missing from your account.')
      
      const { importPublicKey } = await import('@/crypto/keys')
      const importedPublicKey = await importPublicKey(pubKeyBase64)

      // Store in indexedDB
      const restoredKeyPair: CryptoKeyPair = {
        publicKey: importedPublicKey,
        privateKey: importedPrivateKey,
      }
      await storeKeyPair(user.id, restoredKeyPair)

      toast('Keys restored successfully! Please refresh the page.', 'success')
      setRestorePassword('')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      toast(err.message || 'Failed to restore keys. Check your password.', 'error')
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
      // First get all files
      const { data: files } = await supabase.from('files').select('id, storage_path')
      if (files && files.length > 0) {
        // Delete from storage
        const paths = files.map(f => f.storage_path)
        await supabase.storage.from('encrypted-files').remove(paths)
        
        // Delete from database (RLS ensures we only delete ours)
        const fileIds = files.map(f => f.id)
        await supabase.from('files').delete().in('id', fileIds)
      }
      toast('All files permanently deleted.', 'success')
    } catch (err: any) {
      toast('Failed to delete files', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 pt-24 sm:pt-32">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white tracking-tight">Security Settings</h1>
          <p className="text-zinc-400 mt-2">Manage your encryption keys and account data.</p>
        </div>

        <div className="space-y-8">
          
          {/* Key Status & Fingerprint */}
          <section className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Encryption Keys</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${isKeysLoaded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {isKeysLoaded ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-zinc-200 font-medium text-lg">
                  {isKeysLoaded ? 'Keys Generated and Active' : 'Keys Not Found'}
                </h3>
                {fingerprint && (
                  <div className="mt-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Key Fingerprint (SHA-256)</p>
                    <code className="text-xs text-emerald-400/80 bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 font-mono tracking-widest break-all inline-block">
                      {fingerprint}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Backup & Restore */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Backup */}
            <form onSubmit={handleBackup} className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-2">Export Recovery Key</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Download an encrypted backup of your private key. If you clear your browser data or switch devices, you will need this file.
              </p>
              
              <div className="mt-auto space-y-4">
                <input
                  type="password"
                  placeholder="Set a backup password"
                  required
                  disabled={!isKeysLoaded}
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={!isKeysLoaded || isProcessingBackup}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessingBackup ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Backup
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Restore */}
            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 sm:p-8 flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-2">Restore Keys</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Import your private key backup file to regain access to your encrypted files on a new device.
              </p>
              
              <div className="mt-auto space-y-4">
                <input
                  type="password"
                  placeholder="Enter backup password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono text-sm"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingRestore || !restorePassword}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessingRestore ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                      Select Backup File
                    </>
                  )}
                </button>
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleRestore}
                />
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 sm:p-8 mt-12">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-red-400/80 mb-6">Irreversible actions that will permanently destroy your data.</p>
            
            <div className="flex items-center justify-between border border-red-900/50 bg-red-950/30 rounded-xl p-4 sm:p-6">
              <div>
                <h3 className="text-zinc-200 font-medium">Delete All Files</h3>
                <p className="text-sm text-zinc-500 mt-1">Permanently remove all your encrypted files from the database and storage.</p>
              </div>
              <button
                onClick={handleDeleteAllFiles}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ml-6 shrink-0"
              >
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
