import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side use.
 * This client reads authentication from HTTP-only cookies set by the browser client.
 * 
 * Use this in API routes and server components to access authenticated user data.
 * 
 * NOTE: This function must only be called at request time, not during build.
 * Do not call this at the module level or in static generation contexts.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  // Lazy evaluation: cookies() is only called when the cookie methods are invoked
  // This prevents build-time errors
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Only called at request time, not during build
        const cookieStore = cookies()
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          // Only called at request time, not during build
          const cookieStore = cookies()
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
