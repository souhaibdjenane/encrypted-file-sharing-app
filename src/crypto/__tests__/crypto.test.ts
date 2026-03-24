import { describe, it, expect } from 'vitest'
import { generateKeyPair, generateFileKey, exportPublicKey, importPublicKey } from '../keys'
import { encryptFile, encryptMetadata } from '../encrypt'
import { decryptFile, decryptMetadata } from '../decrypt'
import { wrapFileKey, unwrapFileKey } from '../keyWrap'
import { arrayBufferToBase64, base64ToArrayBuffer, bufferToHex } from '../utils'

describe('Crypto Utils', () => {
  it('arrayBufferToBase64 ↔ base64ToArrayBuffer roundtrip', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
    const base64 = arrayBufferToBase64(original.buffer)
    const restored = new Uint8Array(base64ToArrayBuffer(base64))
    expect(restored).toEqual(original)
  })

  it('bufferToHex converts correctly', () => {
    const buffer = new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer
    expect(bufferToHex(buffer)).toBe('deadbeef')
  })
})

describe('Key Generation', () => {
  it('generates an RSA-OAEP 4096-bit key pair', async () => {
    const keyPair = await generateKeyPair()
    expect(keyPair.publicKey).toBeDefined()
    expect(keyPair.privateKey).toBeDefined()
    expect(keyPair.publicKey.algorithm.name).toBe('RSA-OAEP')
    expect(keyPair.privateKey.algorithm.name).toBe('RSA-OAEP')
  })

  it('generates an AES-256-GCM file key', async () => {
    const key = await generateFileKey()
    expect(key.algorithm.name).toBe('AES-GCM')
    expect((key.algorithm as AesKeyGenParams).length).toBe(256)
  })

  it('exports and imports a public key via SPKI', async () => {
    const keyPair = await generateKeyPair()
    const exported = await exportPublicKey(keyPair.publicKey)
    expect(typeof exported).toBe('string')
    expect(exported.length).toBeGreaterThan(0)

    const imported = await importPublicKey(exported)
    expect(imported.algorithm.name).toBe('RSA-OAEP')
  })
})

describe('File Encryption / Decryption Roundtrip', () => {
  it('encrypts and decrypts a file correctly', async () => {
    const content = 'This is a secret file for VaultShare testing.'
    const file = new File([content], 'test.txt', { type: 'text/plain' })

    // Encrypt
    const { ciphertext, iv, fileKey } = await encryptFile(file)
    expect(ciphertext.byteLength).toBeGreaterThan(0)
    expect(iv.length).toBe(12)

    // Decrypt
    const decrypted = await decryptFile(ciphertext, iv, fileKey)
    const restored = new TextDecoder().decode(decrypted)
    expect(restored).toBe(content)
  })

  it('ciphertext differs from plaintext', async () => {
    const content = 'Sensitive data that must be encrypted'
    const file = new File([content], 'secret.txt', { type: 'text/plain' })

    const { ciphertext } = await encryptFile(file)
    const cipherString = new TextDecoder().decode(ciphertext)
    expect(cipherString).not.toBe(content)
  })
})

describe('Metadata Encryption / Decryption Roundtrip', () => {
  it('encrypts and decrypts metadata correctly', async () => {
    const metadata = {
      filename: 'document.pdf',
      size: 1048576,
      mimeType: 'application/pdf',
      tags: ['confidential', 'legal'],
    }

    const fileKey = await generateFileKey()

    // Encrypt
    const encrypted = await encryptMetadata(metadata, fileKey)
    expect(typeof encrypted.ciphertext).toBe('string')
    expect(typeof encrypted.iv).toBe('string')

    // Decrypt
    const decrypted = await decryptMetadata(encrypted.ciphertext, encrypted.iv, fileKey)
    expect(decrypted).toEqual(metadata)
  })
})

describe('Key Wrapping / Unwrapping', () => {
  it('wraps and unwraps a file key using RSA-OAEP', async () => {
    const keyPair = await generateKeyPair()
    const fileKey = await generateFileKey()

    // Wrap with public key
    const wrappedBase64 = await wrapFileKey(fileKey, keyPair.publicKey)
    expect(typeof wrappedBase64).toBe('string')
    expect(wrappedBase64.length).toBeGreaterThan(0)

    // Unwrap with private key
    const unwrapped = await unwrapFileKey(wrappedBase64, keyPair.privateKey)
    expect(unwrapped.algorithm.name).toBe('AES-GCM')

    // Verify the unwrapped key works: encrypt with original, decrypt with unwrapped
    const plaintext = new TextEncoder().encode('Verify key equivalence')
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      fileKey,
      plaintext
    )

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      unwrapped,
      ciphertext
    )

    expect(new TextDecoder().decode(decrypted)).toBe('Verify key equivalence')
  })
})
