import { arrayBufferToBase64, base64ToArrayBuffer } from './utils'

/**
 * Wraps (encrypts) an AES-256-GCM file key using the recipient's RSA-OAEP public key.
 * Returns a base64-encoded wrapped key string.
 */
export async function wrapFileKey(
  fileKey: CryptoKey,
  recipientPublicKey: CryptoKey
): Promise<string> {
  const wrapped = await crypto.subtle.wrapKey(
    'raw',
    fileKey,
    recipientPublicKey,
    { name: 'RSA-OAEP' }
  )
  return arrayBufferToBase64(wrapped)
}

/**
 * Unwraps (decrypts) a base64-encoded wrapped file key using the user's RSA-OAEP private key.
 * Returns an AES-256-GCM CryptoKey.
 */
export async function unwrapFileKey(
  wrappedKeyBase64: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKeyBase64)
  return crypto.subtle.unwrapKey(
    'raw',
    wrappedKeyBuffer,
    privateKey,
    { name: 'RSA-OAEP' },
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}
