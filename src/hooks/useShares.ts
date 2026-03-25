import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchFileShares, createShareRecord, saveSharedFileKey, revokeAccess, getAuthHeaders, type ShareRecord } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import { unwrapFileKey, wrapFileKey } from '@/crypto/keyWrap'
import { importPublicKey, exportRawKeyBase64 } from '@/crypto/keys'

const FUNCTIONS_URL = '/api'

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

      // 3. For private shares, get recipient's public key first
      let wrappedForRecipient: string | undefined = undefined
      if (!isPublic && email) {
        // Call edge function to get recipient details (public key, validate ownership)
        const headers = await getAuthHeaders()
        const preRes = await fetch(`${FUNCTIONS_URL}/share-file`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            fileId,
            recipientEmail: email,
            isPublic: false,
            canDownload,
            canReshare,
            expiresAt,
            // wrappedKey omitted on first call - just to get public key
          }),
        })

        if (!preRes.ok) {
          const err = await preRes.json().catch(() => ({ error: 'Share creation failed' }))
          throw new Error(err.error || `Share creation failed (${preRes.status})`)
        }

        const preData = await preRes.json()
        const { recipientPublicKey } = preData

        if (!recipientPublicKey) throw new Error('Failed to get recipient public key')

        // Wrap the key with recipient's public key
        const recipientCryptoKey = await importPublicKey(recipientPublicKey)
        wrappedForRecipient = await wrapFileKey(rawFileKey, recipientCryptoKey)
      }

      // 4. Create share record with wrapped key (or public link without key)
      const { share, recipientPublicKey } = await createShareRecord({
        fileId,
        email,
        isPublic,
        canDownload,
        canReshare,
        expiresAt,
        wrappedKey: wrappedForRecipient,
      })

      if (isPublic) {
        const exportedRawKey = await exportRawKeyBase64(rawFileKey)
        // URL-encode the base64 key to safely embed it in the hash
        const encodedKey = encodeURIComponent(exportedRawKey)
        const publicUrl = `${window.location.origin}/s/${share.token}#key=${encodedKey}`
        await loadShares()
        return { share, publicUrl }
      }

      // For private shares, file_keys was already created by edge function
      // Just refresh and return
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
