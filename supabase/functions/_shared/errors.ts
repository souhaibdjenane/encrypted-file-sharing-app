import { corsHeaders } from './cors.ts'

/**
 * Application-level error with HTTP status code.
 */
export class AppError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'AppError'
    this.status = status
  }
}

/**
 * Creates a JSON error response with CORS headers.
 */
export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  console.error('[Unhandled Error]', error)
  return new Response(
    JSON.stringify({ error: 'Internal server error' }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}
