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

    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const body = await req.json()
    const { token } = RequestSchema.parse(body)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!
    )

    // Verify share link validity
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*')
      .eq('token', token)
      .single()

    if (shareError || !share || share.revoked || (share.expires_at && new Date(share.expires_at) < new Date())) {
      throw new AppError('Invalid or expired share link', 403)
    }

    if (!share.can_download) {
      throw new AppError('This file is view-only', 403)
    }

    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('storage_path, id')
      .eq('id', share.file_id)
      .single()

    if (fileError || !file) throw new AppError('File not found', 404)

    // Generate signed URL (valid for 5 mins)
    const { data, error } = await supabase.storage
      .from('encrypted-files')
      .createSignedUrl(file.storage_path, 300)

    if (error || !data) {
      throw new AppError('Failed to generate download url', 500)
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: share.shared_by,
      file_id: file.id,
      action: 'download',
      ip_address: ip,
      user_agent: req.headers.get('user-agent'),
      metadata: { via: 'public_link', token },
    })

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return errorResponse(error)
  }
})
