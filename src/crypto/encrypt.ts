
import { arrayBufferToBase64 } from './utils'
import * as Comlink from 'comlink'
import type { WorkerAPI } from '../workers/encrypt.worker'

const worker = new Worker(new URL('../workers/encrypt.worker.ts', import.meta.url), { type: 'module' })
const workerAPI = Comlink.wrap<WorkerAPI>(worker)

/**
 * Encrypts a File using a new AES-256-GCM key.
 * Returns the ciphertext, IV, and the file key (for wrapping/sharing).
 */
export async function encryptFile(
  file: File
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array; fileKey: CryptoKey }> {
  const buffer = await file.arrayBuffer()
  const result = await workerAPI.encryptFileWorker(Comlink.transfer(buffer, [buffer]))
  return { ciphertext: result.ciphertext, iv: result.iv, fileKey: result.fileKey }
}

/**
 * Encrypts a metadata object using the provided AES-256-GCM file key.
 * Returns base64-encoded ciphertext and IV strings.
 */
export async function encryptMetadata(
  metadata: object,
  fileKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(metadata))

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    fileKey,
    encoded
  )

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  }
}
