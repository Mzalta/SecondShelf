import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Ensure this route is dynamic (not statically generated)
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  let returnTo = requestUrl.searchParams.get('returnTo')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // If returnTo wasn't in the URL (OAuth might have stripped it), 
  // we'll rely on client-side code to read from sessionStorage
  // For now, if we have it, use it; otherwise redirect to home
  const redirectUrl = returnTo ? new URL(returnTo, requestUrl.origin) : new URL('/', requestUrl.origin)
  return NextResponse.redirect(redirectUrl)
}

