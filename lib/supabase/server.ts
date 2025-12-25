import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a mock client to avoid errors
    if (process.env.NODE_ENV === 'production' && !supabaseUrl) {
      console.warn('Supabase URL not found during build - using placeholder')
      return createSupabaseClient('https://placeholder.supabase.co', 'placeholder-key', {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    }
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  // Get cookies for server-side authentication
  const cookieStore = cookies()
  
  // Extract project ref from URL to construct cookie names
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1] || ''
  
  // Create a custom storage adapter that reads from Next.js cookies
  // Supabase stores the session as JSON in: sb-<project-ref>-auth-token
  const cookieStorage = {
    getItem: (key: string): string | null => {
      try {
        // Supabase's main auth cookie pattern
        if (projectRef) {
          const authCookie = cookieStore.get(`sb-${projectRef}-auth-token`)
          if (authCookie?.value) {
            try {
              // Parse the session JSON
              const session = JSON.parse(decodeURIComponent(authCookie.value))
              
              // Supabase's storage keys and what they map to in the session
              if (key === 'supabase.auth.token' || key.includes('auth.token')) {
                return authCookie.value // Return full session JSON
              }
              if (key.includes('access_token') || key === 'access_token') {
                return session?.access_token || session?.token || null
              }
              if (key.includes('refresh_token') || key === 'refresh_token') {
                return session?.refresh_token || null
              }
              // For other keys, return the full session
              return authCookie.value
            } catch (parseError) {
              // If parsing fails, return the raw value
              return authCookie.value
            }
          }
        }
        
        // Try direct cookie name matches
        const directCookie = cookieStore.get(key)
        if (directCookie?.value) {
          return directCookie.value
        }
        
        // Try with sb- prefix
        const sbCookie = cookieStore.get(`sb-${key}`)
        if (sbCookie?.value) {
          return sbCookie.value
        }
        
        // Try with project ref prefix
        if (projectRef) {
          const projectCookie = cookieStore.get(`sb-${projectRef}-${key}`)
          if (projectCookie?.value) {
            return projectCookie.value
          }
        }
        
        return null
      } catch (error) {
        console.error('Error reading cookie:', error)
        return null
      }
    },
    setItem: (_key: string, _value: string) => {
      // Server-side: cookies are set via Set-Cookie headers in responses
      // This is a no-op on the server
    },
    removeItem: (_key: string) => {
      // Server-side: cookies are removed via Set-Cookie headers in responses
      // This is a no-op on the server
    },
  }
  
  // Create client with cookie-based storage
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: cookieStorage,
    },
  })
}

