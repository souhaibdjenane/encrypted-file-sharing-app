// Deploy: supabase functions deploy share-file --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.22.4'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { AppError, errorResponse } from '../_shared/errors.ts'
import { logger } from '../_shared/logger.ts'

const ShareSchema = z.object({
  fileId: z.string().uuid(),
  recipientEmail: z.string().email().optional(),
  isPublic: z.boolean().default(false),
  canDownload: z.boolean().default(true),
  canReshare: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
  wrappedKey: z.string().optional(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    // Auth
    const user = await verifyAuth(req)

    // Validate input
    const body = await req.json()
    const { fileId, recipientEmail, isPublic, canDownload, canReshare, expiresAt, wrappedKey } =
      ShareSchema.parse(body)

    if (!isPublic && !recipientEmail) {
      throw new AppError('Must provide recipient email for private shares', 400)
    }

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

    let recipientId: string | null = null
    let recipientPublicKey: string | null = null
    let displayEmail: string | null = 'Public Link'

    if (!isPublic && recipientEmail) {
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

    // Generate unique share token
    const token = crypto.randomUUID()

    // Check if a non-revoked share already exists for this recipient
    // (client may call twice: once without wrappedKey to get public key, once with wrappedKey to save it)
    const { data: existingShare } = await supabase
      .from('shares')
      .select('id')
      .eq('file_id', fileId)
      .eq('shared_with', recipientId)
      .eq('revoked', false)
      .single()

    let share
    let shareError

    // Only create a new share if one doesn't exist or if we're on the first call (wrappedKey not provided yet)
    if (!existingShare && !wrappedKey) {
      // First call: create share and return public key
      const insertResult = await supabase.from('shares').insert({
        file_id: fileId,
        shared_by: user.id,
        shared_with: recipientId,
        recipient_email: displayEmail,
        token,
        can_download: canDownload,
        can_reshare: canReshare,
        expires_at: expiresAt || null,
      }).select().single()

      share = insertResult.data
      shareError = insertResult.error
    } else if (existingShare) {
      // Follow-up call: use the existing share
      const { data: existingData, error: existingError } = await supabase
        .from('shares')
        .select('*')
        .eq('id', existingShare.id)
        .single()

      share = existingData
      shareError = existingError
    } else {
      // Edge case: wrappedKey provided but no existing share
      throw new AppError('Share not found. Try again without wrapped key first.', 404)
    }

    if (shareError || !share) {
      logger.error('Failed to create share', { error: shareError?.message })
      throw new AppError('Failed to create share', 500)
    }

    // For private shares, save the wrapped key (server-side so it bypasses RLS via service-role policy)
    if (!isPublic && recipientId && wrappedKey) {
      // Check if key already exists
      const { data: existing } = await supabase
        .from('file_keys')
        .select('id')
        .eq('file_id', fileId)
        .eq('user_id', recipientId)
        .single()

      if (existing) {
        // Update existing key
        const { error: updateError } = await supabase
          .from('file_keys')
          .update({ wrapped_key: wrappedKey })
          .eq('file_id', fileId)
          .eq('user_id', recipientId)

        if (updateError) {
          logger.error('Failed to update wrapped key', { error: updateError.message })
          throw new AppError('Failed to update shared key', 500)
        }
      } else {
        // Insert new key
        const { error: insertError } = await supabase
          .from('file_keys')
          .insert({
            file_id: fileId,
            user_id: recipientId,
            wrapped_key: wrappedKey,
          })

        if (insertError) {
          logger.error('Failed to insert wrapped key', { error: insertError.message })
          throw new AppError('Failed to save shared key', 500)
        }
      }
      
      logger.info('Wrapped key saved for recipient', { fileId, recipientId })
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

    logger.info('File shared', {
      userId: user.id,
      fileId,
      recipientId: recipientId || 'public',
      isPublic,
    })

    // Return the newly created share and the recipient's public key (if private)
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
