import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchFileShares, createShareRecord, saveSharedFileKey, revokeAccess, type ShareRecord } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import { unwrapFileKey, wrapFileKey } from '@/crypto/keyWrap'
import { importPublicKey, exportRawKeyBase64 } from '@/crypto/keys'

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
    email,
    isPublic,
    canDownload = true,
    canReshare = false,
    expiresAt,
  }: {
    email?: string
    isPublic?: boolean
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

      // 3. Create share record and get recipient's public key from Edge Function
      const { share, recipientPublicKey } = await createShareRecord({
        fileId,
        email,
        isPublic,
        canDownload,
        canReshare,
        expiresAt,
      })

      if (isPublic) {
        const exportedRawKey = await exportRawKeyBase64(rawFileKey)
        const publicUrl = `${window.location.origin}/s/${share.token}#key=${exportedRawKey}`
        await loadShares()
        return { share, publicUrl }
      }

      if (!recipientPublicKey || !email) throw new Error('Missing recipient details')

      // 4. Import recipient public key and wrap the file key
      const recipientCryptoKey = await importPublicKey(recipientPublicKey)
      const wrappedForRecipient = await wrapFileKey(rawFileKey, recipientCryptoKey)

      // 5. Save the new wrapped key
      await saveSharedFileKey({
        fileId,
        recipientId: share.shared_with as string, // Might be null for public links, but sharing via email requires recipientId
        wrappedKey: wrappedForRecipient,
      })

      // 6. Refresh list
      await loadShares()
      return share
    } catch (err: any) {
      setError(err.message || 'Failed to share file')
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
