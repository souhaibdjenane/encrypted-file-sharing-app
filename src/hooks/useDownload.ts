import { useState, useCallback } from 'react'
import { requestDownloadUrl } from '@/api/filesApi'
import { unwrapFileKey } from '@/crypto/keyWrap'
import { decryptFile } from '@/crypto/decrypt'
import { decryptMetadata } from '@/crypto/decrypt'
import { base64ToArrayBuffer } from '@/crypto/utils'
import { useCrypto } from '@/crypto/CryptoProvider'

export type DownloadStage = 'idle' | 'preparing' | 'downloading' | 'decrypting' | 'done' | 'error'

interface DownloadState {
  stage: DownloadStage
  error: string | null
}

export function useDownload() {
  const { keyPair } = useCrypto()
  const [state, setState] = useState<DownloadState>({ stage: 'idle', error: null })

  const download = useCallback(async (
    fileId: string,
    wrappedKey: string,
    fileIv: string
  ) => {
    if (!keyPair) {
      setState({ stage: 'error', error: 'Encryption keys not ready.' })
      return
    }

    try {
      setState({ stage: 'preparing', error: null })

      // Step 1: Get signed download URL
      const { signedUrl, encrypted_metadata } = await requestDownloadUrl(fileId)

      setState({ stage: 'downloading', error: null })

      // Step 2: Fetch encrypted blob
      const res = await fetch(signedUrl)
      if (!res.ok) throw new Error('Failed to download file')
      const ciphertext = await res.arrayBuffer()

      setState({ stage: 'decrypting', error: null })

      // Step 3: Unwrap file key
      const fileKey = await unwrapFileKey(wrappedKey, keyPair.privateKey)

      // Step 4: Decrypt file
      const iv = new Uint8Array(base64ToArrayBuffer(fileIv))
      const plaintext = await decryptFile(ciphertext, iv, fileKey)

      // Step 5: Decrypt metadata for filename
      let fileName = 'download'
      if (encrypted_metadata) {
        try {
          const meta = await decryptMetadata(
            encrypted_metadata.ciphertext,
            encrypted_metadata.iv,
            fileKey
          ) as { name?: string; type?: string }
          if (meta.name) fileName = meta.name
        } catch {
          // Use fallback filename
        }
      }

      // Step 6: Trigger browser download
      const blob = new Blob([plaintext])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setState({ stage: 'done', error: null })
      setTimeout(() => setState({ stage: 'idle', error: null }), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed'
      setState({ stage: 'error', error: message })
    }
  }, [keyPair])

  return { ...state, download }
}
