import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchFileShares, createShareRecord, revokeAccess, type ShareRecord } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import { unwrapFileKey } from '@/crypto/keyWrap'
import { exportRawKeyBase64 } from '@/crypto/keys'


export function useShares(fileId: string) {
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { keyPair } = useCrypto()

  const loadShares = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchFileShares(fileId)
      setShares(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load shares')
    } finally {
      setIsLoading(false)
    }
  }

  const shareFile = async ({
    canDownload = true,
    canReshare = false,
    expiresAt,
  }: {
    canDownload?: boolean
    canReshare?: boolean
    expiresAt?: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      if (!keyPair) throw new Error('Crypto keys not initialized')

      // 1. Fetch own file key
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: fileKeys, error: fkError } = await supabase
        .from('file_keys')
        .select('wrapped_key')
        .eq('file_id', fileId)
        .eq('user_id', user.id)
        .single()

      if (fkError || !fileKeys) throw new Error('Failed to fetch your file key')

      // 2. Unwrap the file key
      const rawFileKey = await unwrapFileKey(fileKeys.wrapped_key, keyPair.privateKey)

      // 3. Create public share record (private sharing removed)
      const { share } = await createShareRecord({
        fileId,
        isPublic: true,
        canDownload,
        canReshare,
        expiresAt,
      })

      console.log('📧 Public share created:', { share })

      const exportedRawKey = await exportRawKeyBase64(rawFileKey)
      // URL-encode the base64 key to safely embed it in the hash
      const encodedKey = encodeURIComponent(exportedRawKey)
      const publicUrl = `${window.location.origin}/s/${share.token}#key=${encodedKey}`
      await loadShares()
      return { share, publicUrl }
    } catch (err: any) {
      setError(err.message || 'Failed to create public link')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const revokeShare = async (shareId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await revokeAccess(shareId)
      // Optimistic update
      setShares((prev) => prev.map((s) => (s.id === shareId ? { ...s, revoked: true } : s)))
    } catch (err: any) {
      setError(err.message || 'Failed to revoke access')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    shares,
    isLoading,
    error,
    loadShares,
    shareFile,
    revokeShare,
  }
}
