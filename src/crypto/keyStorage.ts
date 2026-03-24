const DB_NAME = 'e2e-keys'
const STORE_NAME = 'keypairs'
const DB_VERSION = 1

/**
 * Opens (or creates) the IndexedDB database for key storage.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Stores a CryptoKeyPair in IndexedDB, keyed by userId.
 */
export async function storeKeyPair(
  userId: string,
  keyPair: CryptoKeyPair
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({
      userId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Loads a CryptoKeyPair from IndexedDB by userId.
 * Returns null if no key pair exists for the given user.
 */
export async function loadKeyPair(
  userId: string
): Promise<CryptoKeyPair | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(userId)

    request.onsuccess = () => {
      const result = request.result
      if (result) {
        resolve({
          publicKey: result.publicKey,
          privateKey: result.privateKey,
        } as CryptoKeyPair)
      } else {
        resolve(null)
      }
    }
    request.onerror = () => reject(request.error)
  })
}
