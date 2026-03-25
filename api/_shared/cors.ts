export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': (process.env.ALLOWED_ORIGIN || '*').replace(/\/$/, ''),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
}

export function corsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}
