import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export async function signInWithGoogle(returnTo?: string) {
  try {
    const supabase = createClient()
    
    // Get the current origin (works for both localhost and production)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const baseRedirectTo = origin ? `${origin}/auth/callback` : 'https://second-shelf.vercel.app/auth/callback'
    
    // If returnTo is provided, add it as a query parameter so the callback can redirect there
    // OAuth providers preserve query parameters in the redirect_uri
    const redirectTo = returnTo 
      ? `${baseRedirectTo}?returnTo=${encodeURIComponent(returnTo)}`
      : baseRedirectTo
    
    console.log('OAuth redirect URL:', redirectTo)
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
    
    // If data.url exists, the redirect should happen automatically
    // But we can also check if it's null which might indicate an issue
    if (!data.url) {
      console.error('No redirect URL returned from OAuth')
      throw new Error('Failed to initiate Google sign-in. Please check your Supabase configuration.')
    }
    
    return { data, error: null }
  } catch (error: any) {
    console.error('Sign in with Google failed:', error)
    throw error
  }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

