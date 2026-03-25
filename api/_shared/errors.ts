import { corsHeaders } from './cors'

export class AppError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'AppError'
    this.status = status
  }
}

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
