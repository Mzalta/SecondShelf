import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server-side auth gating for /subscription route.
 * This prevents unauthenticated users from accessing the subscription page
 * before the client component even renders, eliminating race conditions.
 * 
 * Note: This provides an additional layer of protection. The client component
 * also handles auth state properly after hydration as a fallback.
 */
export default async function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  // Check authentication on the server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If user is not authenticated, redirect to home
  // The client component will also check auth state after hydration as a fallback
  if (error || !user) {
    redirect('/')
  }

  return <>{children}</>
}

