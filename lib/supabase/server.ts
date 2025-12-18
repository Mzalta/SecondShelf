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

  // For server components, we can use a simpler client
  // Cookies are handled by Next.js automatically
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

