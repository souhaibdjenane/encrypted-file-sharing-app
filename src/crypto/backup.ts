import { arrayBufferToBase64, base64ToArrayBuffer } from './utils'

const PBKDF2_ITERATIONS = 600_000
const SALT_SIZE = 16

/**
 * Generates a random 16-byte salt and returns it as a base64 string.
 */
export function generateSaltBase64(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE))
  return arrayBufferToBase64(salt.buffer as ArrayBuffer)
}

/**
 * Derives a 256-bit AES-GCM key from a password and salt using PBKDF2.
 */
async function deriveKeyFromPassword(password: string, saltBuffer: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // derived key is not extractable
    ['encrypt', 'decrypt']
  )
}

/**
 * Exports an RSA private key to PKCS#8, encrypts it with the derived key, and returns base64 format.
 */
export async function exportEncryptedPrivateKey(
  privateKey: CryptoKey,
  password: string,
  saltBase64: string
): Promise<{ encryptedPkcs8Base64: string; ivBase64: string }> {
  // 1. Export the private key to raw PKCS#8 format
  const pkcs8Buffer = await crypto.subtle.exportKey('pkcs8', privateKey)

  // 2. Derive encryption key from password
  const saltBuffer = base64ToArrayBuffer(saltBase64)
  const aesKey = await deriveKeyFromPassword(password, saltBuffer)

  // 3. Encrypt the PKCS#8 buffer
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    pkcs8Buffer
  )

  return {
    encryptedPkcs8Base64: arrayBufferToBase64(encryptedBuffer),
    ivBase64: arrayBufferToBase64(iv.buffer as ArrayBuffer),
  }
}

/**
 * Decrypts a backup block, imports it as a CryptoKey, and returns it.
 */
export async function importEncryptedPrivateKey(
  encryptedPkcs8Base64: string,
  ivBase64: string,
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  // 1. Derive decryption key from password
  const saltBuffer = base64ToArrayBuffer(saltBase64)
  const aesKey = await deriveKeyFromPassword(password, saltBuffer)

  // 2. Decrypt the PKCS#8 payload
  const encryptedBuffer = base64ToArrayBuffer(encryptedPkcs8Base64)
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64))

  let pkcs8Buffer: ArrayBuffer
  try {
    pkcs8Buffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encryptedBuffer
    )
  } catch (err) {
    throw new Error('Incorrect password or invalid backup file.')
  }

  // 3. Import the decrypted PKCS#8 back into an RSA-OAEP private key
  return crypto.subtle.importKey(
    'pkcs8',
    pkcs8Buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true, // Must be extractable so we can export it again later if needed
    ['unwrapKey']
  )
}
