// Deploy: supabase functions deploy share-file --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.22.4'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { rateLimit } from '../_shared/rateLimit.ts'
import { AppError, errorResponse } from '../_shared/errors.ts'
import { logger } from '../_shared/logger.ts'

const ShareSchema = z.object({
  fileId: z.string().uuid(),
  recipientEmail: z.string().email(),
  canDownload: z.boolean().default(true),
  canReshare: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    // Auth
    const user = await verifyAuth(req)

    // Rate limit: 20 per 5 minutes per user
    await rateLimit(`share:${user.id}`, 20, 300)

    // Validate input
    const body = await req.json()
    const { fileId, recipientEmail, canDownload, canReshare, expiresAt } =
      ShareSchema.parse(body)

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // Verify requester owns the file
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, owner_id')
      .eq('id', fileId)
      .eq('owner_id', user.id)
      .single()

    if (fileError || !file) {
      throw new AppError('File not found or you are not the owner', 403)
    }

    // Look up recipient by email via admin auth API
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

    // Get recipient's public key from user metadata
    const recipientPublicKey = recipient.user_metadata?.public_key
    if (!recipientPublicKey) {
      throw new AppError(
        'Recipient has not generated encryption keys yet. They must log in first.',
        400
      )
    }

    // Generate unique share token
    const token = crypto.randomUUID()

    // Insert share record
    const { error: shareError } = await supabase.from('shares').insert({
      file_id: fileId,
      shared_by: user.id,
      shared_with: recipient.id,
      token,
      can_download: canDownload,
      can_reshare: canReshare,
      expires_at: expiresAt || null,
    })

    if (shareError) {
      logger.error('Failed to create share', { error: shareError.message })
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
        recipient_email: recipientEmail,
        recipient_id: recipient.id,
        can_download: canDownload,
        can_reshare: canReshare,
      },
    })

    logger.info('File shared', {
      userId: user.id,
      fileId,
      recipientId: recipient.id,
    })

    // Return recipient's public key so client can wrap the file key
    return new Response(
      JSON.stringify({
        shareId: token,
        recipientId: recipient.id,
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
