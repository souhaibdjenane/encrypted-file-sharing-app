import { createClient } from '@supabase/supabase-js'
import { AppError } from './errors'

interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

export async function verifyAuth(req: Request): Promise<AuthUser> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid Authorization header', 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const url = process.env.SUPABASE_URL
  const key = process.env.SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new AppError('Server configuration error', 500)
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    throw new AppError('Invalid or expired session token', 401)
  }

  return data.user as AuthUser
}
