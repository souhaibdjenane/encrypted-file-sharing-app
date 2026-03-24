import * as Comlink from 'comlink'

async function encryptFileWorker(buffer: ArrayBuffer) {
  const fileKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    fileKey,
    buffer
  )

  // Transfer ciphertext out of the worker
  return Comlink.transfer(
    { ciphertext, iv, fileKey },
    [ciphertext]
  )
}

async function decryptFileWorker(
  ciphertext: ArrayBuffer,
  iv: Uint8Array,
  fileKey: CryptoKey
) {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    fileKey,
    ciphertext
  )
  
  return Comlink.transfer(plaintext, [plaintext])
}

const workerAPI = {
  encryptFileWorker,
  decryptFileWorker
}

export type WorkerAPI = typeof workerAPI

Comlink.expose(workerAPI)
