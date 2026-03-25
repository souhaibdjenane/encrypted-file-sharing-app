import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { corsHeaders, corsResponse } from './_shared/cors'
import { verifyAuth } from './_shared/auth'
import { AppError, errorResponse } from './_shared/errors'
import { logger } from './_shared/logger'

export const config = {
  runtime: 'edge',
}

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 MB

const UploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
})

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const user = await verifyAuth(req)
    logger.info('Upload presign requested', { userId: user.id })

    const body = await req.json()
    const { fileName, contentType, fileSize } = UploadSchema.parse(body)

    const fileId = crypto.randomUUID()
    const storagePath = `${user.id}/${fileId}`

    const url = process.env.SUPABASE_URL
    const key = process.env.SERVICE_ROLE_KEY

    if (!url || !key) {
       throw new AppError('Server configuration error', 500)
    }

    const supabase = createClient(url, key)

    const { data, error } = await supabase.storage
      .from('encrypted-files')
      .createSignedUploadUrl(storagePath)

    if (error) {
      logger.error('Failed to create signed upload URL', { error: error.message })
      throw new AppError(`Failed to generate upload URL: ${error.message}`, 500)
    }

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
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    return errorResponse(error)
  }
}
