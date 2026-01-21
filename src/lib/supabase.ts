import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client for client-side usage
export function createClientSupabase() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Server client for server-side usage (App Router)
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignore errors when setting cookies in Server Components
          // This is expected when called from a Server Component
        }
      },
    },
  })
}

// Server action client (for mutations)
export async function createActionSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      },
    },
  })
}

// Legacy export for backwards compatibility
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Helper function for API routes
export function createRouteHandlerSupabase(request: Request) {
  const cookieHeader = request.headers.get('cookie')

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        if (!cookieHeader) return []
        return cookieHeader.split(';').map(cookie => {
          const [name, value] = cookie.trim().split('=')
          return { name, value }
        })
      },
      setAll() {
        // Cookies cannot be set in route handlers through this method
      },
    },
  })
}

// Auth helper functions
export async function getSession() {
  const supabase = await createServerSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export async function getUser() {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function signOut() {
  const supabase = await createActionSupabase()
  await supabase.auth.signOut()
}
