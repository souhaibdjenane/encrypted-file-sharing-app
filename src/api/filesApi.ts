import { supabase } from '@/lib/supabase'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

/**
 * Helper to get auth headers for Edge Function calls.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not authenticated')

  return {
    'Authorization': `Bearer ${token}`,
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
  }
}

/**
 * Request a signed upload URL from the upload-presign Edge Function.
 */
export async function requestUploadUrl(params: {
  fileName: string
  contentType: string
  fileSize: number
}): Promise<{ signedUrl: string; token: string; storagePath: string; fileId: string }> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/upload-presign`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload presign failed' }))
    throw new Error(err.error || `Upload presign failed (${res.status})`)
  }

  return res.json()
}

/**
 * Request a signed download URL from the download-presign Edge Function.
 */
export async function requestDownloadUrl(fileId: string): Promise<{
  signedUrl: string
  encrypted_metadata: { ciphertext: string; iv: string } | null
  iv: string
}> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/download-presign`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fileId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Download presign failed' }))
    throw new Error(err.error || `Download presign failed (${res.status})`)
  }

  return res.json()
}

/**
 * Upload encrypted ciphertext to Supabase Storage via signed URL.
 */
export async function uploadToStorage(
  signedUrl: string,
  ciphertext: ArrayBuffer,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(ciphertext)
  })
}

/**
 * Save file record and wrapped key to Supabase DB.
 */
export async function saveFileRecord(params: {
  id: string
  ownerId: string
  storagePath: string
  encryptedMetadata: { ciphertext: string; iv: string }
  fileSizeBytes: number
  mimeType: string
  iv: string
  wrappedKey: string
}): Promise<void> {
  // Insert file record
  const { error: fileError } = await supabase.from('files').insert({
    id: params.id,
    owner_id: params.ownerId,
    storage_path: params.storagePath,
    encrypted_metadata: params.encryptedMetadata,
    file_size_bytes: params.fileSizeBytes,
    mime_type: params.mimeType,
    iv: params.iv,
  })

  if (fileError) throw new Error(`Failed to save file: ${fileError.message}`)

  // Insert wrapped key for the owner
  const { error: keyError } = await supabase.from('file_keys').insert({
    file_id: params.id,
    user_id: params.ownerId,
    wrapped_key: params.wrappedKey,
  })

  if (keyError) throw new Error(`Failed to save file key: ${keyError.message}`)
}

/**
 * Fetch all files owned by the current user.
 */
export async function fetchUserFiles() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('files')
    .select('*, file_keys!inner(wrapped_key)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch files: ${error.message}`)
  return data || []
}

/**
 * Delete a file (removes DB record + storage object).
 */
export async function deleteFile(fileId: string, storagePath: string): Promise<void> {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('encrypted-files')
    .remove([storagePath])

  if (storageError) {
    console.warn('Storage delete failed:', storageError.message)
  }

  // Delete DB record (cascades to file_keys and shares)
  const { error: dbError } = await supabase.from('files').delete().eq('id', fileId)
  if (dbError) throw new Error(`Failed to delete file: ${dbError.message}`)
}
