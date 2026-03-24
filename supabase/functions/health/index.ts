// Deploy: supabase functions deploy health --no-verify-jwt

import { corsHeaders, corsResponse } from '../_shared/cors.ts'

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  return new Response(
    JSON.stringify({
      status: 'ok',
      ts: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
