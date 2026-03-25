import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { corsHeaders, corsResponse } from './_shared/cors'
import { verifyAuth } from './_shared/auth'
import { AppError, errorResponse } from './_shared/errors'

export const config = {
  runtime: 'edge',
}

const RequestSchema = z.object({
  fileId: z.string().uuid(),
})

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') throw new AppError('Method not allowed', 405)

    const user = await verifyAuth(req)
    const body = await req.json()
    const { fileId } = RequestSchema.parse(body)

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!
    )

    // Fetch the file record to get storage path and metadata
    const { data: initialFile, error: fileError } = await supabase
      .from('files')
      .select('storage_path, encrypted_metadata, iv')
      .eq('id', fileId)
      .eq('owner_id', user.id) // Ensure owner
      .single()

    let file = initialFile

    if (fileError || !file) {
      // Check if it's shared with the user
      const { data: shared, error: sharedError } = await supabase
        .from('shares')
        .select('file_id')
        .eq('file_id', fileId)
        .eq('shared_with', user.id)
        .eq('revoked', false)
        .single()

      if (sharedError || !shared) {
        throw new AppError('File not found or access denied', 403)
      }

      // If shared, fetch the file record without owner check
      const { data: sharedFile, error: sharedFileError } = await supabase
        .from('files')
        .select('storage_path, encrypted_metadata, iv')
        .eq('id', fileId)
        .single()

      if (sharedFileError || !sharedFile) throw new AppError('File not found', 404)
      
      file = sharedFile
    }

    // Generate signed URL
    const { data, error } = await supabase.storage
      .from('encrypted-files')
      .createSignedUrl(file.storage_path, 300)

    if (error || !data) throw new AppError('Failed to generate download URL', 500)

    return new Response(
      JSON.stringify({ 
        signedUrl: data.signedUrl,
        encrypted_metadata: file.encrypted_metadata,
        iv: file.iv
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return errorResponse(error)
  }
}
