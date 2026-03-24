import { createClient } from 'npm:@supabase/supabase-js@2'
import { AppError } from './errors.ts'

interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}


  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid Authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '')

  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('VAULT_SECRET_KEY') || Deno.env.get('SERVICE_ROLE_KEY')

  if (!url || !key) {
    console.error('[verifyAuth] Missing env vars:', { url: !!url, key: !!key })
    throw new AppError('Server configuration error', 500)
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new AppError('Invalid or expired session token', 401)
  }

  return data.user as AuthUser
}
