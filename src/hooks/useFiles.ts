import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUserFiles } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import { unwrapFileKey } from '@/crypto/keyWrap'
import { decryptMetadata } from '@/crypto/decrypt'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'

export interface DecryptedFile {
  id: string
  storagePath: string
  fileSizeBytes: number
  mimeType: string
  iv: string
  createdAt: string
  expiresAt: string | null
  downloadCount: number
  downloadLimit: number | null
  wrappedKey: string
  // Decrypted metadata
  name: string
  decryptedType: string
  isDecrypted: boolean
}

export function useFiles() {
  const { user } = useAuthStore()
  const { keyPair } = useCrypto()
  const queryClient = useQueryClient()
  const [decryptedFiles, setDecryptedFiles] = useState<DecryptedFile[]>([])

  const query = useQuery({
    queryKey: ['files', user?.id],
    queryFn: fetchUserFiles,
    enabled: !!user,
    staleTime: 30_000,
  })

  // Decrypt metadata when files load
  useEffect(() => {
    if (!query.data || !keyPair) return

    const decryptAll = async () => {
      const results: DecryptedFile[] = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query.data.map(async (file: any) => {
          const wrappedKey = file.file_keys?.[0]?.wrapped_key || ''
          const base: DecryptedFile = {
            id: file.id,
            storagePath: file.storage_path,
            fileSizeBytes: file.file_size_bytes,
            mimeType: file.mime_type,
            iv: file.iv,
            createdAt: file.created_at,
            expiresAt: file.expires_at,
            downloadCount: file.download_count,
            downloadLimit: file.download_limit,
            wrappedKey,
            name: 'Encrypted File',
            decryptedType: file.mime_type || 'unknown',
            isDecrypted: false,
          }

          if (!wrappedKey || !file.encrypted_metadata) return base

          try {
            const fileKey = await unwrapFileKey(wrappedKey, keyPair.privateKey)
            const meta = await decryptMetadata(
              file.encrypted_metadata.ciphertext,
              file.encrypted_metadata.iv,
              fileKey
            ) as { name?: string; type?: string; size?: number }

            return {
              ...base,
              name: meta.name || 'Unnamed File',
              decryptedType: meta.type || base.mimeType,
              isDecrypted: true,
            }
          } catch {
            return base
          }
        })
      )
      setDecryptedFiles(results)
    }

    decryptAll()
  }, [query.data, keyPair])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['files', user?.id] })
  }

  return {
    files: decryptedFiles,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  }
}
