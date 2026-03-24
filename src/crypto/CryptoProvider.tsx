import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { generateKeyPair, exportPublicKey } from './keys'
import { storeKeyPair, loadKeyPair } from './keyStorage'
import { generateSaltBase64 } from './backup'
import { supabase } from '@/lib/supabase'

interface CryptoContextValue {
  keyPair: CryptoKeyPair | null
  isKeysLoaded: boolean
  isInitializing: boolean
}

const CryptoContext = createContext<CryptoContextValue>({
  keyPair: null,
  isKeysLoaded: false,
  isInitializing: false,
})

/**
 * Initializes user keys: loads from IndexedDB or generates new ones,
 * stores them, and uploads the public key to Supabase user metadata.
 */
async function initializeUserKeys(userId: string): Promise<CryptoKeyPair> {
  // Try to load existing key pair from IndexedDB
  const existing = await loadKeyPair(userId)
  if (existing) {
    return existing
  }

  // Generate new key pair
  const keyPair = await generateKeyPair()

  // Store in IndexedDB
  await storeKeyPair(userId, keyPair)

  // Upload public key and backup salt to Supabase user metadata
  const publicKeyBase64 = await exportPublicKey(keyPair.publicKey)
  const saltBase64 = generateSaltBase64()

  await supabase.auth.updateUser({
    data: { public_key: publicKeyBase64, backup_salt: saltBase64 },
  })

  return keyPair
}

export function CryptoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthStore()
  const [keyPair, setKeyPair] = useState<CryptoKeyPair | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    if (!user) {
      setKeyPair(null)
      return
    }

    let cancelled = false
    setIsInitializing(true)

    initializeUserKeys(user.id)
      .then((kp) => {
        if (!cancelled) {
          setKeyPair(kp)
        }
      })
      .catch((err) => {
        console.error('Failed to initialize crypto keys:', err)
      })
      .finally(() => {
        if (!cancelled) {
          setIsInitializing(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <CryptoContext.Provider
      value={{
        keyPair,
        isKeysLoaded: keyPair !== null,
        isInitializing,
      }}
    >
      {children}
    </CryptoContext.Provider>
  )
}

/**
 * Hook to access the current user's CryptoKeyPair from the CryptoProvider context.
 */
export function useCrypto(): CryptoContextValue {
  const context = useContext(CryptoContext)
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider')
  }
  return context
}
