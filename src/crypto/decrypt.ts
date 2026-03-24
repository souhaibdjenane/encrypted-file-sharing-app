import { base64ToArrayBuffer } from './utils'
import * as Comlink from 'comlink'
import type { WorkerAPI } from '../workers/encrypt.worker'

const worker = new Worker(new URL('../workers/encrypt.worker.ts', import.meta.url), { type: 'module' })
const workerAPI = Comlink.wrap<WorkerAPI>(worker)

/**
 * Decrypts an AES-256-GCM encrypted file.
 * Returns the original plaintext as an ArrayBuffer.
 */
export async function decryptFile(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  fileKey: CryptoKey
): Promise<ArrayBuffer> {
  return workerAPI.decryptFileWorker(Comlink.transfer(ciphertext, [ciphertext]), iv, fileKey)
}

/**
 * Decrypts base64-encoded AES-256-GCM encrypted metadata.
 * Returns the parsed object.
 */
export async function decryptMetadata(
  ciphertext: string,
  iv: string,
  fileKey: CryptoKey
): Promise<object> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext)
  const ivBuffer = new Uint8Array(base64ToArrayBuffer(iv))

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    fileKey,
    ciphertextBuffer
  )

  const decoded = new TextDecoder().decode(decrypted)
  return JSON.parse(decoded)
}
