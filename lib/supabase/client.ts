/**
 * @deprecated Use createBrowserClient from './browser' instead.
 * This file is kept for backward compatibility but will delegate to browser.ts
 */
import { createBrowserClient } from './browser'

/**
 * Create a Supabase client for browser use.
 * This is a wrapper around createBrowserClient to maintain backward compatibility.
 * 
 * @deprecated Import createBrowserClient from './browser' directly for new code.
 */
export function createClient() {
  return createBrowserClient()
}

