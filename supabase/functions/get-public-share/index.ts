import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.22.4'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { AppError, errorResponse } from '../_shared/errors.ts'

const RequestSchema = z.object({
  token: z.string().uuid(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') throw new AppError('Method not allowed', 405)

    const body = await req.json()
    const { token } = RequestSchema.parse(body)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // Find the share
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('token', token)
      .single()

    if (shareError || !share) {
      throw new AppError('Share link not found or invalid', 404)
    }

    if (share.revoked) {
      throw new AppError('This share link has been revoked by the owner', 403)
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new AppError('This share link has expired', 403)
    }

    // Get file info (only safe metadata)
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, encrypted_metadata, file_size_bytes, iv, storage_path')
      .eq('id', share.file_id)
      .single()

    if (fileError || !file) {
      throw new AppError('Original file no longer exists', 404)
    }

    return new Response(JSON.stringify({ file, share }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: corsHeaders })
    }
    return errorResponse(error)
  }
})
