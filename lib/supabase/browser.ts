import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

/**
 * Shared Supabase browser client singleton.
 * This ensures all client components use the same Supabase instance,
 * preventing auth state race conditions.
 * 
 * Uses @supabase/ssr for proper cookie handling in Next.js 14.
 */
let supabaseClient: ReturnType<typeof createSSRBrowserClient> | null = null

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

  // Create browser client using @supabase/ssr for proper cookie handling
  supabaseClient = createSSRBrowserClient(supabaseUrl, supabaseAnonKey)

  return supabaseClient
}

/**
 * Get the shared browser client instance.
 * Use this in all client components to ensure consistent auth state.
 */
export const getBrowserClient = () => createBrowserClient()
