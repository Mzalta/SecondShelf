'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { useBookStore } from '@/lib/store/useBookStore'
import { createClient } from '@/lib/supabase/client'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  useEffect(() => {
    // Always try to fetch subscription status - don't rely solely on currentUser from store
    fetchSubscriptionStatus()
    
    if (success === 'true') {
      // Refresh status after successful subscription
      setTimeout(() => {
        fetchSubscriptionStatus()
      }, 2000)
    }
  }, [success])

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get access token from Supabase session (always check, don't rely on store)
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('You must be signed in to view your subscription status')
        setLoading(false)
        return
      }

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
    try {
      setProcessing(true)
      setError(null)

      // Get access token from Supabase session (always check, don't rely on store)
      const supabase = createClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setError('You must be signed in to upgrade to Pro')
        setProcessing(false)
        return
      }

      const accessToken = session.access_token

      if (!accessToken) {
        setError('No access token found. Please sign in again.')
        setProcessing(false)
        return
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      }

      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        credentials: 'include',
        headers,
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMessage = data.error || 'Failed to create checkout session'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
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
      await fetchSubscriptionStatus()
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

  if (loading) {
    return (
      <div className="py-8">
        <Loading />
      </div>
    )
  }

  // Show message if there's an auth error (but don't block on currentUser from store)
  if (error && error.includes('sign in') && !loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Subscription</h1>
        <Card>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              Please sign in to view your subscription status and upgrade to Pro.
            </p>
            <p className="text-sm text-gray-500">
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

            <Button
              variant="primary"
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full text-lg py-3"
            >
              {processing ? 'Processing...' : 'Subscribe to Pro'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

