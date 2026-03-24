import { useQuery } from '@tanstack/react-query'
import { fetchSharedWithMe } from '@/api/filesApi'
import { useCrypto } from '@/crypto/CryptoProvider'
import { unwrapFileKey } from '@/crypto/keyWrap'
import { decryptMetadata } from '@/crypto/decrypt'

export interface DecryptedFile {
  id: string
  name: string
  decryptedType: string
  fileSizeBytes: number
  mimeType: string
  createdAt: string
  expiresAt: string | null
  downloadLimit: number | null
  downloadCount: number
  storagePath: string
  wrappedKey: string
  iv: string
  isDecrypted: boolean
  share: any // details about the share
}

export function useSharedFiles() {
  const { keyPair } = useCrypto()

  const query = useQuery({
    queryKey: ['shared_files'],
    queryFn: async () => {
      const encryptedFiles = await fetchSharedWithMe()

      if (!keyPair) {
        // Can't decrypt metadata yet, return as encrypted
        return encryptedFiles.map((file: any) => ({
          id: file.id,
          name: 'Encrypted File',
          decryptedType: 'application/octet-stream',
          mimeType: file.mime_type,
          fileSizeBytes: file.file_size_bytes,
          createdAt: file.created_at,
          expiresAt: file.expires_at,
          downloadLimit: file.download_limit,
          downloadCount: file.download_count,
          storagePath: file.storage_path,
          wrappedKey: file.file_keys[0].wrapped_key,
          iv: file.iv,
          isDecrypted: false,
          share: file.shares[0], // the first matching share
        }))
      }

      const decryptedPromises = encryptedFiles.map(async (file: any): Promise<DecryptedFile> => {
        try {
          const wrappedKey = file.file_keys[0].wrapped_key
          const rawFileKey = await unwrapFileKey(wrappedKey, keyPair.privateKey)
          const meta = await decryptMetadata(
            file.encrypted_metadata.ciphertext,
            file.encrypted_metadata.iv,
            rawFileKey
          ) as { name: string; type: string }

          return {
            id: file.id,
            name: meta.name,
            decryptedType: meta.type,
            mimeType: file.mime_type,
            fileSizeBytes: file.file_size_bytes,
            createdAt: file.created_at,
            expiresAt: file.expires_at,
            downloadLimit: file.download_limit,
            downloadCount: file.download_count,
            storagePath: file.storage_path,
            wrappedKey,
            iv: file.iv,
            isDecrypted: true,
            share: file.shares[0],
          }
        } catch (err) {
          console.error(`Failed to decrypt metadata for shared file ${file.id}`, err)
          return {
            id: file.id,
            name: 'Encrypted File',
            decryptedType: 'application/octet-stream',
            mimeType: file.mime_type,
            fileSizeBytes: file.file_size_bytes,
            createdAt: file.created_at,
            expiresAt: file.expires_at,
            downloadLimit: file.download_limit,
            downloadCount: file.download_count,
            storagePath: file.storage_path,
            wrappedKey: file.file_keys[0].wrapped_key,
            iv: file.iv,
            isDecrypted: false,
            share: file.shares[0],
          }
        }
      })

      return Promise.all(decryptedPromises)
    },
    enabled: !!keyPair,
  })

  return {
    files: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    invalidate: () => query.refetch(),
  }
}
