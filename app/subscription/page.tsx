'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { useBookStore } from '@/lib/store/useBookStore'
import { createBrowserClient } from '@/lib/supabase/browser'
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'

interface SubscriptionStatus {
  subscription: any
  isActive: boolean
  isPro: boolean
}

export default function SubscriptionPage() {
  const { currentUser } = useBookStore()
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authHydrated, setAuthHydrated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const sessionId = searchParams.get('session_id')
  const supabase = createBrowserClient()
  const authCheckedRef = useRef(false)
  const pendingRetryRef = useRef(false)

  // Define fetchSubscriptionStatus using useCallback so it can be used in useEffect
  const fetchSubscriptionStatus = useCallback(async (session: Session, checkoutSessionId?: string) => {
    let shouldSetLoadingFalse = true // Flag to control if we set loading to false
    
    try {
      setLoading(true)
      setError(null)

      const accessToken = session.access_token

      if (!accessToken) {
        setError('No access token found. Please sign in again.')
        setLoading(false)
        return
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      }

      // Include session_id in query params if available (for strong consistency)
      const url = checkoutSessionId 
        ? `/api/subscriptions/status?session_id=${encodeURIComponent(checkoutSessionId)}`
        : '/api/subscriptions/status'

      console.log(`🔍 Fetching subscription status${checkoutSessionId ? ` with session_id: ${checkoutSessionId}` : ''}`)

      const response = await fetch(url, {
        credentials: 'include',
        headers,
      })
      
      // Handle 202 Accepted (pending) status
      if (response.status === 202) {
        const data = await response.json()
        console.log('⚠️ Subscription status is pending, will retry once after delay')
        
        // Retry once after 1.5 seconds if not already retried
        if (!pendingRetryRef.current) {
          pendingRetryRef.current = true
          shouldSetLoadingFalse = false // Keep loading true while waiting for retry
          // Retry after delay
          setTimeout(async () => {
            console.log('🔄 Retrying subscription status fetch...')
            await fetchSubscriptionStatus(session, checkoutSessionId)
          }, 1500)
          return
        } else {
          // Already retried, still pending - show as no subscription but allow user to retry manually
          console.log('⚠️ Still pending after retry, showing free account state')
          // Reset the retry flag for future manual retries
          pendingRetryRef.current = false
          // Set subscription status to null (no subscription) so UI can render
          setSubscriptionStatus({
            subscription: null,
            isActive: false,
            isPro: false,
          })
          // Set loading to false so UI can render
          shouldSetLoadingFalse = true
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to fetch subscription status'
        setError(errorMessage)
        console.error('Subscription status API error:', errorMessage, response.status)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('✅ Subscription status fetched:', { 
        isPro: data.isPro, 
        isActive: data.isActive,
        status: data.subscription?.status,
        hasSubscription: !!data.subscription,
        synced: data.synced 
      })
      
      // Reset pending retry flag on success
      pendingRetryRef.current = false
      setSubscriptionStatus(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription status')
      console.error('Error fetching subscription status:', err)
      // Always set loading to false on error, even if we were in a retry state
      shouldSetLoadingFalse = true
    } finally {
      // Only set loading to false if we're not in a pending retry state
      if (shouldSetLoadingFalse) {
        setLoading(false)
      }
    }
  }, [])

  // Wait for auth state to hydrate before checking authentication
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    // Set up auth state listener - this is the primary way to detect auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      // Auth state has changed - mark as hydrated
      setAuthHydrated(true)
      setUser(session?.user ?? null)
      
      // Clear any pending timeout since we got an auth state change
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      // If we have a session and haven't checked subscription status yet, fetch it
      if (session?.user && !authCheckedRef.current) {
        authCheckedRef.current = true
        fetchSubscriptionStatus(session)
      } else if (!session?.user) {
        // User is not authenticated
        authCheckedRef.current = true
        setLoading(false)
      }
    })

    // Also check initial session (but don't rely on it alone)
    // This provides an immediate check while waiting for onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        setAuthHydrated(true)
        setUser(session.user)
        if (!authCheckedRef.current) {
          authCheckedRef.current = true
          fetchSubscriptionStatus(session)
        }
      } else {
        // No session found - set a fallback timeout in case onAuthStateChange doesn't fire
        // This handles edge cases where session hasn't hydrated yet
        timeoutId = setTimeout(() => {
          setAuthHydrated(true)
          setLoading(false)
        }, 1000)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [fetchSubscriptionStatus, supabase])

  // Handle success parameter - fetch status with session_id if available (strong consistency)
  useEffect(() => {
    if (success === 'true' && user && authHydrated) {
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (session) {
          // Pass session_id to API for strong consistency (bypasses eventually consistent search)
          fetchSubscriptionStatus(session, sessionId || undefined)
        }
      })
    }
  }, [success, user, authHydrated, sessionId, fetchSubscriptionStatus])

  const handleSubscribe = async () => {
    console.log('handleSubscribe called')
    try {
      setProcessing(true)
      setError(null)

      console.log('Getting session...')
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('Session result:', { hasSession: !!session, error: sessionError })
      
      if (sessionError || !session) {
        console.error('No session found:', sessionError)
        setError('You must be signed in to upgrade to Pro')
        setProcessing(false)
        return
      }

      const accessToken = session.access_token

      if (!accessToken) {
        console.error('No access token in session')
        setError('No access token found. Please sign in again.')
        setProcessing(false)
        return
      }

      console.log('Creating checkout session...')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      }

      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        credentials: 'include',
        headers,
      })

      console.log('Checkout response status:', response.status)

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const errorMessage = data.error || 'Failed to create checkout session'
        console.error('Checkout error:', errorMessage)
        setError(errorMessage)
        setProcessing(false)
        return
      }

      const data = await response.json()
      console.log('Checkout data:', data)
      
      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('Redirecting to:', data.url)
        // Use window.location.assign instead of href to prevent page refresh issues
        window.location.assign(data.url)
      } else {
        console.error('No URL in response')
        setError('No checkout URL received')
        setProcessing(false)
      }
    } catch (err: any) {
      console.error('handleSubscribe error:', err)
      setError(err.message || 'Failed to start subscription')
      setProcessing(false)
    }
  }

  const handleRefresh = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Reset pending retry flag on manual refresh
      pendingRetryRef.current = false
      await fetchSubscriptionStatus(session)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return
    }

    try {
      setProcessing(true)
      setError(null)

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Refresh status
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetchSubscriptionStatus(session)
      }
      alert('Your subscription will be canceled at the end of the billing period.')
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription')
    } finally {
      setProcessing(false)
    }
  }

  const handleReactivate = async () => {
    if (!confirm('Are you sure you want to reactivate your subscription? Your subscription will continue automatically.')) {
      return
    }

    try {
      setProcessing(true)
      setError(null)

      const response = await fetch('/api/subscriptions/reactivate', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      // Refresh status
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetchSubscriptionStatus(session)
      }
      alert('Your subscription has been reactivated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate subscription')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'N/A'
    }
    try {
      const date = new Date(dateString)
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'N/A'
    }
  }

  // Show loading while auth is hydrating or initial load
  if (!authHydrated || (loading && !subscriptionStatus)) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Manage Subscription</h1>
        <Loading />
      </div>
    )
  }

  // Only show "Sign In Required" if auth has hydrated and user is definitely not authenticated
  if (!user && authHydrated) {
      return (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Manage Subscription</h1>
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to view your subscription status and manage your account.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Use the Sign In button in the header to get started.
              </p>
            </div>
          </Card>
        </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Subscription</h1>
        {user && (
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors border border-gray-300"
            title="Refresh subscription status"
            disabled={loading}
          >
            {loading ? '⏳' : '↻'} Refresh
          </button>
        )}
      </div>

      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          autoDismiss={false}
        />
      )}

      {success === 'true' && subscriptionStatus?.isPro && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          ✅ Subscription activated successfully! Welcome to Pro!
        </div>
      )}

      {canceled === 'true' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
          Subscription checkout was canceled.
        </div>
      )}

      <Card>
        {subscriptionStatus?.isPro ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-purple-600 mb-2">Pro Account</h2>
                <p className="text-gray-600">You have full access to all features</p>
              </div>
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
                Active
              </span>
            </div>

            {subscriptionStatus.subscription && (
              <div className="space-y-4 mb-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold capitalize px-3 py-1 bg-white rounded">
                    {subscriptionStatus.subscription.status}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="mb-3">
                    <span className="text-sm text-gray-500 block mb-1">Subscription Expires:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatDate(subscriptionStatus.subscription.current_period_end)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Current Period: {formatDate(subscriptionStatus.subscription.current_period_start)} - {formatDate(subscriptionStatus.subscription.current_period_end)}
                  </div>
                </div>
                {subscriptionStatus.subscription.cancel_at_period_end && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-800 font-medium">Will cancel on:</span>
                      <span className="font-semibold text-yellow-900">
                        {formatDate(subscriptionStatus.subscription.current_period_end)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {subscriptionStatus.subscription?.cancel_at_period_end ? (
              <Button
                variant="primary"
                onClick={handleReactivate}
                disabled={processing}
                className="w-full"
              >
                {processing ? 'Processing...' : 'Reactivate Subscription'}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={processing}
                className="w-full"
              >
                {processing ? 'Processing...' : 'Cancel Subscription'}
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <div className="mb-4">
                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold text-sm">
                  Free Account
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Upgrade to Pro</h2>
              <p className="text-gray-600 mb-6">
                Get unlimited access to all features with a monthly subscription
              </p>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                $9.99<span className="text-lg text-gray-600">/month</span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <div>
                  <span className="font-medium">Messaging</span>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <div>
                  <span className="font-medium">AI Advanced Search</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Natural language search that understands what you&apos;re looking for to find the perfect textbooks
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <div>
                  <span className="font-medium">AI-Enhanced Book Listings</span>
                  <p className="text-sm text-gray-600 mt-1">
                    Smart summaries and insights that help you discover the perfect match faster
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('=== BUTTON CLICKED ===')
                  handleSubscribe()
                }}
                disabled={processing}
                className="w-full text-lg py-3"
              >
                {processing ? 'Processing...' : 'Subscribe to Pro'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
