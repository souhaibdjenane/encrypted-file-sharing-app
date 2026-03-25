import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { corsHeaders, corsResponse } from './_shared/cors'
import { verifyAuth } from './_shared/auth'
import { AppError, errorResponse } from './_shared/errors'
import { logger } from './_shared/logger'

export const config = {
  runtime: 'edge',
}

const ShareSchema = z.object({
  fileId: z.string().uuid(),
  recipientEmail: z.string().email().optional(),
  isPublic: z.boolean().default(false),
  canDownload: z.boolean().default(true),
  canReshare: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
})

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const user = await verifyAuth(req)

    const body = await req.json()
    const { fileId, recipientEmail, isPublic, canDownload, canReshare, expiresAt } =
      ShareSchema.parse(body)

    if (!isPublic && !recipientEmail) {
      throw new AppError('Must provide recipient email for private shares', 400)
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!
    )

    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, owner_id')
      .eq('id', fileId)
      .eq('owner_id', user.id)
      .single()

    if (fileError || !file) {
      throw new AppError('File not found or you are not the owner', 403)
    }

    let recipientId: string | null = null
    let recipientPublicKey: string | null = null
    let displayEmail: string | null = 'Public Link'

    if (!isPublic && recipientEmail) {
      const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()

      if (usersError) {
        logger.error('Failed to list users', { error: usersError.message })
        throw new AppError('Failed to look up recipient', 500)
      }

      const recipient = usersData.users.find(
        (u) => u.email?.toLowerCase() === recipientEmail.toLowerCase()
      )

      if (!recipient) {
        throw new AppError('Recipient not found. They must have a VaultShare account.', 404)
      }

      recipientPublicKey = recipient.user_metadata?.public_key
      if (!recipientPublicKey) {
        throw new AppError(
          'Recipient has not generated encryption keys yet. They must log in first.',
          400
        )
      }

      recipientId = recipient.id
      displayEmail = recipientEmail
    }

    const token = crypto.randomUUID()

    const { data: share, error: shareError } = await supabase.from('shares').insert({
      file_id: fileId,
      shared_by: user.id,
      shared_with: recipientId,
      recipient_email: displayEmail,
      token,
      can_download: canDownload,
      can_reshare: canReshare,
      expires_at: expiresAt || null,
    }).select().single()

    if (shareError || !share) {
      logger.error('Failed to create share', { error: shareError?.message })
      throw new AppError('Failed to create share', 500)
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      file_id: fileId,
      action: 'share',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      user_agent: req.headers.get('user-agent'),
      metadata: {
        recipient_email: displayEmail,
        recipient_id: recipientId,
        is_public: isPublic,
        can_download: canDownload,
        can_reshare: canReshare,
      },
    })

    return new Response(
      JSON.stringify({
        share,
        recipientPublicKey,
      }),
      {
        status: 201,
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
