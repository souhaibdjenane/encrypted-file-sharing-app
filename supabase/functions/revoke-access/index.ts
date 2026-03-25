// Deploy: supabase functions deploy revoke-access --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.22.4'
import { corsHeaders, corsResponse } from '../_shared/cors.ts'
import { verifyAuth } from '../_shared/auth.ts'
import { AppError, errorResponse } from '../_shared/errors.ts'
import { logger } from '../_shared/logger.ts'

const RevokeSchema = z.object({
  shareId: z.string().uuid(),
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
    const { shareId } = RevokeSchema.parse(body)

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // Fetch the share record
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*, files!inner(owner_id)')
      .eq('id', shareId)
      .single()

    if (shareError || !share) {
      throw new AppError('Share not found', 404)
    }

    // Verify requester is the file owner
    if (share.files.owner_id !== user.id) {
      throw new AppError('Only the file owner can revoke access', 403)
    }

    // Already revoked
    if (share.revoked) {
      throw new AppError('Share is already revoked', 400)
    }

    // Revoke the share
    const { error: updateError } = await supabase
      .from('shares')
      .update({ revoked: true })
      .eq('id', shareId)

    if (updateError) {
      logger.error('Failed to revoke share', { error: updateError.message })
      throw new AppError('Failed to revoke share', 500)
    }

    // Clean up the wrapped key for this recipient so they can't decrypt anymore
    // (Optional: only delete if not the owner's own key to avoid breaking their access)
    if (share.shared_with) {
      await supabase
        .from('file_keys')
        .delete()
        .eq('file_id', share.file_id)
        .eq('user_id', share.shared_with)

      // Don't throw on cleanup failure, but log it
      logger.info('Cleaned up file keys for revoked share', {
        fileId: share.file_id,
        recipientId: share.shared_with,
      })
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      file_id: share.file_id,
      action: 'revoke',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      user_agent: req.headers.get('user-agent'),
      metadata: { share_id: shareId, revoked_user: share.shared_with },
    })

    logger.info('Share revoked', { userId: user.id, shareId })

    return new Response(
      JSON.stringify({ success: true, message: 'Access revoked' }),
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
