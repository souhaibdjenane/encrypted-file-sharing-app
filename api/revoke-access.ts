import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { corsHeaders, corsResponse } from './_shared/cors'
import { verifyAuth } from './_shared/auth'
import { AppError, errorResponse } from './_shared/errors'
import { logger } from './_shared/logger'

export const config = {
  runtime: 'edge',
}

const RevokeSchema = z.object({
  shareId: z.string().uuid(),
})

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    if (req.method !== 'POST') {
      throw new AppError('Method not allowed', 405)
    }

    const user = await verifyAuth(req)

    const body = await req.json()
    const { shareId } = RevokeSchema.parse(body)

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SERVICE_ROLE_KEY!
    )

    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*, files!inner(owner_id)')
      .eq('id', shareId)
      .single()

    if (shareError || !share) {
      throw new AppError('Share not found', 404)
    }

    if ((share as any).files.owner_id !== user.id) {
      throw new AppError('Only the file owner can revoke access', 403)
    }

    if (share.revoked) {
      throw new AppError('Share is already revoked', 400)
    }

    const { error: updateError } = await supabase
      .from('shares')
      .update({ revoked: true })
      .eq('id', shareId)

    if (updateError) {
      logger.error('Failed to revoke share', { error: updateError.message })
      throw new AppError('Failed to revoke share', 500)
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
