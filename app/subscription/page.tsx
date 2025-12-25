'use client'

import { useState, useEffect, useRef } from 'react'
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
  const supabase = createBrowserClient()
  const authCheckedRef = useRef(false)

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
  }, [])

  // Handle success parameter
  useEffect(() => {
    if (success === 'true' && user) {
      // Refresh status after successful subscription
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (session) {
          fetchSubscriptionStatus(session)
        }
      })
    }
  }, [success, user])

  const fetchSubscriptionStatus = async (session: Session) => {
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

      const response = await fetch('/api/subscriptions/status', {
        credentials: 'include',
        headers,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to fetch subscription status'
        setError(errorMessage)
        console.error('Subscription status API error:', errorMessage, response.status)
        setLoading(false)
        return
      }

      const data = await response.json()
      setSubscriptionStatus(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription status')
      console.error('Error fetching subscription status:', err)
    } finally {
      setLoading(false)
    }
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Show loading while auth is hydrating
  if (!authHydrated || loading) {
    return (
      <div className="py-8">
        <Loading />
      </div>
    )
  }

  // Only show "Sign In Required" if auth has hydrated and user is definitely not authenticated
  if (!user && authHydrated) {
      return (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Subscription</h1>
          <Card>
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">
                Please sign in to view your subscription status and upgrade to Pro.
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
      <h1 className="text-3xl font-bold mb-6">Subscription</h1>

      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          autoDismiss={false}
        />
      )}

      {success === 'true' && (
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
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-semibold capitalize">
                    {subscriptionStatus.subscription.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Period:</span>
                  <span className="font-semibold">
                    {formatDate(subscriptionStatus.subscription.current_period_start)} - {formatDate(subscriptionStatus.subscription.current_period_end)}
                  </span>
                </div>
                {subscriptionStatus.subscription.cancel_at_period_end && (
                  <div className="flex justify-between text-yellow-600">
                    <span>Will cancel on:</span>
                    <span className="font-semibold">
                      {formatDate(subscriptionStatus.subscription.current_period_end)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {subscriptionStatus.subscription?.cancel_at_period_end ? (
              <Button
                variant="primary"
                onClick={handleCancel}
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
                <span>Unlimited book listings</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Priority support</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Advanced search filters</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>No ads</span>
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
