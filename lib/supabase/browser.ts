import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Shared Supabase browser client singleton.
 * This ensures all client components use the same Supabase instance,
 * preventing auth state race conditions.
 */
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export function createBrowserClient() {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  // Create client with proper browser auth configuration
  supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

/**
 * Get the shared browser client instance.
 * Use this in all client components to ensure consistent auth state.
 */
export const getBrowserClient = () => createBrowserClient()

