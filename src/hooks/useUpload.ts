import { useState, useCallback } from 'react'
import { encryptFile, encryptMetadata } from '@/crypto/encrypt'
import { wrapFileKey } from '@/crypto/keyWrap'
import { arrayBufferToBase64 } from '@/crypto/utils'
import { useCrypto } from '@/crypto/CryptoProvider'
import { useAuthStore } from '@/store/authStore'
import { requestUploadUrl, uploadToStorage, saveFileRecord } from '@/api/filesApi'
import { validateFileType } from '@/utils/fileValidation'

export type UploadStage = 'idle' | 'encrypting' | 'uploading' | 'saving' | 'done' | 'error'

interface UploadState {
  stage: UploadStage
  progress: number
  error: string | null
  fileName: string | null
}

export function useUpload() {
  const { keyPair } = useCrypto()
  const { user } = useAuthStore()
  const [state, setState] = useState<UploadState>({
    stage: 'idle',
    progress: 0,
    error: null,
    fileName: null,
  })

  const reset = useCallback(() => {
    setState({ stage: 'idle', progress: 0, error: null, fileName: null })
  }, [])

  const upload = useCallback(async (file: File) => {
    if (!keyPair || !user) {
      setState(s => ({ ...s, stage: 'error', error: 'Encryption keys not ready. Please wait.' }))
      return
    }

    try {
      setState({ stage: 'encrypting', progress: 0, error: null, fileName: file.name })

      // Step 0: Validate file type
      await validateFileType(file)

      // Step 1: Encrypt the file
      const { ciphertext, iv, fileKey } = await encryptFile(file)

      // Step 2: Encrypt metadata
      const encryptedMeta = await encryptMetadata(
        { name: file.name, size: file.size, type: file.type },
        fileKey
      )

      // Step 3: Wrap file key with own public key
      const wrappedKey = await wrapFileKey(fileKey, keyPair.publicKey)

      setState(s => ({ ...s, stage: 'uploading', progress: 0 }))

      // Step 4: Get presigned upload URL
      const { signedUrl, storagePath, fileId } = await requestUploadUrl({
        fileName: file.name,
        contentType: 'application/octet-stream',
        fileSize: ciphertext.byteLength,
      })

      // Step 5: Upload encrypted blob
      await uploadToStorage(signedUrl, ciphertext, 'application/octet-stream', (pct) => {
        setState(s => ({ ...s, progress: pct }))
      })

      setState(s => ({ ...s, stage: 'saving', progress: 100 }))

      // Step 6: Save to DB
      const ivBase64 = arrayBufferToBase64(iv.buffer as ArrayBuffer)
      await saveFileRecord({
        id: fileId,
        ownerId: user.id,
        storagePath,
        encryptedMetadata: encryptedMeta,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/octet-stream',
        iv: ivBase64,
        wrappedKey,
      })

      setState(s => ({ ...s, stage: 'done' }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setState(s => ({ ...s, stage: 'error', error: message }))
    }
  }, [keyPair, user])

  return { ...state, upload, reset }
}
