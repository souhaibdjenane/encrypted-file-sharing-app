import { arrayBufferToBase64, base64ToArrayBuffer } from './utils'

/**
 * Generates an RSA-OAEP 4096-bit key pair for wrapping/unwrapping file keys.
 * The keys are extractable so they can be stored in IndexedDB.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['wrapKey', 'unwrapKey']
  )
}

/**
 * Generates an AES-256-GCM key for encrypting/decrypting files.
 */
export async function generateFileKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable so it can be wrapped for sharing
    ['encrypt', 'decrypt']
  )
}

/**
 * Exports a public CryptoKey to a base64-encoded SPKI string.
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key)
  return arrayBufferToBase64(exported)
}

/**
 * Imports a base64-encoded SPKI string as a public CryptoKey.
 */
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64)
  return crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['wrapKey']
  )
}

/**
 * Exports a raw AES-GCM CryptoKey directly to a base64 string for embedding in public URLs.
 */
export async function exportRawKeyBase64(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key)
  return arrayBufferToBase64(exported)
}

/**
 * Imports a raw base64 string directly into an AES-GCM CryptoKey.
 */
export async function importRawKeyBase64(base64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64)
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  )
}
