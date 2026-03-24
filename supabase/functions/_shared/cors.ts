const allowedOrigin = Deno.env.get('ALLOWED_ORIGIN') || 'http://localhost:5173'

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
}

/**
 * Returns a preflight OPTIONS response with CORS headers.
 */
export function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}
