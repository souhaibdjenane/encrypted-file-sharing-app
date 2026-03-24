// Deploy: supabase functions deploy upload-presign --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.22.4'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { AppError, errorResponse } from '../_shared/errors.ts'
import { logger } from '../_shared/logger.ts'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

const UploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    // Auth
    let user;
    try {
      user = await verifyAuth(req)
    } catch (authErr) {
      console.error('[upload-presign] verifyAuth failed:', authErr);
      throw authErr;
    }
    logger.info('Upload presign requested', { userId: user.id })

    // Validate input
    const body = await req.json()
    const { fileName, contentType, fileSize } = UploadSchema.parse(body)

    // Generate storage path
    const fileId = crypto.randomUUID()
    const storagePath = `${user.id}/${fileId}`

    const url = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SERVICE_ROLE_KEY')

    if (!url || !key) {
       console.error('[upload-presign] Missing env vars:', { url: !!url, key: !!key })
       throw new AppError('Server configuration error in upload-presign', 500)
    }

    // Create Supabase admin client for storage operations
    const supabase = createClient(url, key)

    // Generate signed upload URL
    const { data, error } = await supabase.storage
      .from('encrypted-files')
      .createSignedUploadUrl(storagePath)

    if (error) {
      logger.error('Failed to create signed upload URL', { error: error.message, details: error })
      throw new AppError(`Failed to generate upload URL: ${error.message}`, 500)
    }

    if (!data) {
       console.error('[upload-presign] createSignedUploadUrl returned no data and no error!');
       throw new AppError('Failed to generate upload URL (no data returns)', 500)
    }

    logger.info('Upload presign generated', {
      userId: user.id,
      storagePath,
      fileName,
      fileSize,
    })

    return new Response(
      JSON.stringify({
        signedUrl: data.signedUrl,
        token: data.token,
        storagePath,
        fileId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('[upload-presign] Unhandled error:', error);
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
