// Deploy: supabase functions deploy download-presign --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.22.4'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { rateLimit } from '../_shared/rateLimit.ts'
import { AppError, errorResponse } from '../_shared/errors.ts'
import { logger } from '../_shared/logger.ts'

const DownloadSchema = z.object({
  fileId: z.string().uuid(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    // Auth
    const user = await verifyAuth(req)

    // Rate limit: 50 per minute per user
    await rateLimit(`download:${user.id}`, 50, 60)

    // Validate input
    const body = await req.json()
    const { fileId } = DownloadSchema.parse(body)

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // Fetch the file record
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      throw new AppError('File not found', 404)
    }

    // Check access: owner or valid share
    const isOwner = file.owner_id === user.id

    if (!isOwner) {
      const { data: share } = await supabase
        .from('shares')
        .select('*')
        .eq('file_id', fileId)
        .eq('shared_with', user.id)
        .eq('revoked', false)
        .eq('can_download', true)
        .single()

      if (!share) {
        throw new AppError('Access denied', 403)
      }

      // Check share expiry
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        throw new AppError('Share link has expired', 403)
      }
    }

    // Check file expiry
    if (file.expires_at && new Date(file.expires_at) < new Date()) {
      throw new AppError('File has expired', 410)
    }

    // Enforce download limit
    if (file.download_limit !== null && file.download_count >= file.download_limit) {
      throw new AppError('Download limit reached', 429)
    }

    // Increment download count
    await supabase
      .from('files')
      .update({ download_count: file.download_count + 1 })
      .eq('id', fileId)

    // Generate signed download URL (1 hour expiry)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('encrypted-files')
      .createSignedUrl(file.storage_path, 3600)

    if (signedError) {
      logger.error('Failed to create signed download URL', { error: signedError.message })
      throw new AppError('Failed to generate download URL', 500)
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      file_id: fileId,
      action: 'download',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      user_agent: req.headers.get('user-agent'),
      metadata: { is_owner: isOwner },
    })

    logger.info('Download presign generated', { userId: user.id, fileId })

    return new Response(
      JSON.stringify({
        signedUrl: signedData.signedUrl,
        encrypted_metadata: file.encrypted_metadata,
        iv: file.iv,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: error.errors }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    return errorResponse(error)
  }
})
