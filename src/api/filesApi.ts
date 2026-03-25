import { supabase } from '@/lib/supabase'

const FUNCTIONS_URL = '/api'

/**
 * Helper to get auth headers for Edge Function calls.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
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

  const { error: dbError } = await supabase.from('files').delete().eq('id', fileId)
  if (dbError) throw new Error(`Failed to delete file: ${dbError.message}`)
}

export interface ShareRecord {
  id: string
  file_id: string
  shared_by: string
  shared_with: string | null
  recipient_email: string | null
  token: string
  can_download: boolean
  can_reshare: boolean
  created_at: string
  expires_at: string | null
  revoked: boolean
}

/**
 * Fetch all share records for a specific file.
 */
export async function fetchFileShares(fileId: string): Promise<ShareRecord[]> {
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch shares: ${error.message}`)
  return data || []
}

/**
 * Call the edge function to create a new share record and retrieve the recipient's public key.
 */
export async function createShareRecord(params: {
  fileId: string
  email?: string
  isPublic?: boolean
  canDownload?: boolean
  canReshare?: boolean
  expiresAt?: string
  wrappedKey?: string
}): Promise<{ share: ShareRecord; recipientPublicKey?: string }> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/share-file`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fileId: params.fileId,
      recipientEmail: params.email,
      isPublic: params.isPublic,
      canDownload: params.canDownload,
      canReshare: params.canReshare,
      expiresAt: params.expiresAt,
      wrappedKey: params.wrappedKey,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Share creation failed' }))
    throw new Error(err.error || `Share creation failed (${res.status})`)
  }

  return res.json()
}

/**
 * Save a newly re-encrypted file key for a recipient.
 * Uses upsert to handle re-sharing after revocation (same user may get a new wrapped key).
 */
export async function saveSharedFileKey(params: {
  fileId: string
  recipientId: string
  wrappedKey: string
}): Promise<void> {
  const { error } = await supabase.from('file_keys').upsert(
    {
      file_id: params.fileId,
      user_id: params.recipientId,
      wrapped_key: params.wrappedKey,
    },
    { onConflict: 'file_id,user_id' }
  )

  if (error) throw new Error(`Failed to save shared file key: ${error.message}`)
}

/**
 * Call the edge function to revoke access to a share.
 */
export async function revokeAccess(shareId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/revoke-access`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ shareId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Revoke failed' }))
    throw new Error(err.error || `Revocation failed (${res.status})`)
  }
}

/**
 * Fetch all files that have been shared with the current user.
 */
export async function fetchSharedWithMe() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // We fetch files by inner joining `shares` where shared_with = auth.uid()
  // and we ALSO fetch `file_keys` where user_id = auth.uid() to get our wrapped key for decryption.
  const { data, error } = await supabase
    .from('files')
    .select('*, shares!inner(*), file_keys!inner(wrapped_key)')
    .eq('shares.shared_with', user.id)
    .eq('shares.revoked', false)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch shared files: ${error.message}`)

  // For shared files, there may be multiple shares (e.g., if re-shared).
  // The query returns them grouped by file. PostgREST returns `shares` and `file_keys` as arrays for the 1:N relations.
  // We normalize the response to match the shape expected by FileCard (a single wrappedKey).
  return data.map((item: any) => ({
    ...item,
    // The inner join ensures file_keys has at least 1 item (the one for the current user)
    // because `file_keys.user_id = auth.uid()` is enforced by RLS.
    file_keys: item.file_keys,
  }))
}

export interface AuditLog {
  id: string
  file_id: string
  user_id: string
  action: string
  ip_address: string | null
  user_agent: string | null
  metadata: any
  created_at: string
}

/**
 * Fetch all audit logs for a specific file.
 */
export async function fetchFileAuditLogs(fileId: string): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch audit logs: ${error.message}`)
  return data || []
}


