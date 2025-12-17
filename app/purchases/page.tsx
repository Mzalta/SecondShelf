'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Purchase } from '@/types'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { getCurrentUser } from '@/lib/auth/auth'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  useEffect(() => {
    fetchPurchases()
    
    // Show success message if redirected from successful payment
    if (success === 'true') {
      // You could show a toast notification here
      console.log('Payment successful!')
    }
  }, [success])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      setError(null)

      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/callback')
        return
      }

      const response = await fetch('/api/purchases')
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchases')
      }

      const data = await response.json()
      setPurchases(data.purchases || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase history')
      console.error('Error fetching purchases:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Purchase['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      succeeded: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatAmount = (amountInCents: number, currency: string = 'usd') => {
    const amount = amountInCents / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="py-8">
        <Loading />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Purchases</h1>

      {error && (
        <ErrorDisplay
          error={error}
          onDismiss={() => setError(null)}
          autoDismiss={false}
        />
      )}

      {success === 'true' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Payment successful! Your purchase has been recorded.
        </div>
      )}

      {purchases.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven't made any purchases yet.</p>
            <a
              href="/"
              className="text-purple-600 hover:text-purple-800 font-semibold"
            >
              Browse books →
            </a>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id} hover>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  {purchase.book ? (
                    <>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {purchase.book.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Author:</strong> {purchase.book.author}</p>
                        <p><strong>Course:</strong> {purchase.book.course}</p>
                      </div>
                    </>
                  ) : (
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Book (ID: {purchase.bookId})
                    </h3>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600 mb-2">
                    {formatAmount(purchase.amount, purchase.currency)}
                  </p>
                  {getStatusBadge(purchase.status)}
                </div>
              </div>
              <div className="text-xs text-gray-500 border-t pt-3 mt-3">
                <p>Purchased on: {new Date(purchase.createdAt).toLocaleDateString()}</p>
                {purchase.status === 'succeeded' && (
                  <p className="text-green-600 mt-1">✓ Payment completed</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

