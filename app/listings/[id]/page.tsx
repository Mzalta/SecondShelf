'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/browser'
import { useProStatus } from '@/lib/hooks/useProStatus'
import { getBuyerInsights, getRemainingEnhancements } from '@/app/actions/enhanceListing'
import { Book } from '@/types'
import Button from '@/components/ui/Button'
import { ArrowLeft, Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/auth'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string
  const { isPro, loading: proLoading } = useProStatus()
  const [listing, setListing] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    fetchListing()
    getCurrentUser().then(setCurrentUser)
  }, [listingId])

  const fetchListing = async () => {
    try {
      setLoading(true)
      const supabase = createBrowserClient()
      const { data, error: fetchError } = await supabase
        .from('books')
        .select('*')
        .eq('id', listingId)
        .single()

      if (fetchError) {
        setError('Listing not found')
        return
      }

      setListing(data as Book)
    } catch (err: any) {
      setError(err.message || 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const handleGetInsights = async () => {
    if (!isPro) {
      router.push('/subscription')
      return
    }

    setLoadingInsights(true)
    setInsightsError(null)

    try {
      const response = await getBuyerInsights(listingId)
      if (response.success && response.data) {
        setInsights(response.data)
        setRemaining(response.remaining || null)
        setShowInsights(true)
      } else {
        setInsightsError(response.error || 'Failed to get insights')
        setRemaining(response.remaining || null)
      }
    } catch (err: any) {
      setInsightsError(err.message || 'An error occurred')
    } finally {
      setLoadingInsights(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-600" size={32} />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The listing you are looking for does not exist.'}</p>
          <Link href="/">
            <Button variant="primary">Back to Listings</Button>
          </Link>
        </div>
      </div>
    )
  }

  const priceValue = listing.price.replace(/[^0-9.]/g, '')
  const isPrice = /^\$?\d+/.test(listing.price)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Listings
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Image Section */}
          <div className="w-full h-96 bg-gradient-to-br from-teal-50 to-purple-50 flex items-center justify-center relative">
            {listing.imageUrl ? (
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-8xl opacity-30">📚</div>
            )}
            {listing.sold && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="bg-red-600 text-white px-6 py-3 rounded font-bold text-2xl">SOLD</span>
              </div>
            )}
            {listing.category && (
              <div className="absolute top-4 left-4">
                <span className="bg-white bg-opacity-90 text-sm font-semibold px-3 py-1 rounded text-gray-700">
                  {listing.category}
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Title and Author */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            <p className="text-lg text-gray-600 mb-4">by {listing.author}</p>

            {/* Course Badge */}
            <div className="mb-4">
              <span className="inline-block bg-teal-100 text-teal-700 text-sm font-medium px-3 py-1 rounded">
                {listing.course}
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              {isPrice ? (
                <span className="text-4xl font-bold text-gray-900">{listing.price}</span>
              ) : (
                <span className="text-2xl font-semibold text-gray-900">{listing.price}</span>
              )}
            </div>

            {/* Additional Details */}
            {(listing.isbn || listing.edition || listing.condition_text) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
                {listing.isbn && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">ISBN: </span>
                    <span className="text-sm text-gray-600">{listing.isbn}</span>
                  </div>
                )}
                {listing.edition && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Edition: </span>
                    <span className="text-sm text-gray-600">{listing.edition}</span>
                  </div>
                )}
                {listing.condition_text && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Condition: </span>
                    <span className="text-sm text-gray-600">{listing.condition_text}</span>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact Seller</h2>
              <div className="flex items-center gap-2 text-gray-700">
                {listing.contact.includes('@') ? (
                  <Mail size={18} className="text-gray-500" />
                ) : (
                  <Phone size={18} className="text-gray-500" />
                )}
                <span>{listing.contact}</span>
              </div>
              {listing.poster && (
                <p className="text-sm text-gray-600 mt-1">Seller: {listing.poster}</p>
              )}
            </div>

            {/* Pro AI Insights Section */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              {proLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Checking Pro status...</span>
                </div>
              ) : !currentUser ? (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="text-purple-600 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Pro AI Insights</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Sign in and upgrade to Pro to get AI-generated insights about this listing, including condition summary, fair price range, and value assessment.
                      </p>
                      <Link href="/auth/callback">
                        <Button variant="primary" size="sm">Sign In</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : !isPro ? (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="text-purple-600 mt-0.5" size={20} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Pro AI Insights</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Upgrade to Pro to get AI-generated insights about this listing, including condition summary, fair price range, and value assessment.
                      </p>
                      <Link href="/subscription">
                        <Button variant="primary" size="sm">Upgrade to Pro</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-purple-600" size={20} />
                      <h3 className="text-xl font-semibold text-gray-900">Pro AI Insights</h3>
                    </div>
                    {remaining !== null && (
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {remaining} uses remaining today
                      </span>
                    )}
                  </div>

                  {!showInsights && (
                    <Button
                      onClick={handleGetInsights}
                      disabled={loadingInsights}
                      variant="primary"
                      className="w-full"
                    >
                      {loadingInsights ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Generating Insights...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Get AI Insights
                        </>
                      )}
                    </Button>
                  )}

                  {insightsError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="text-red-600 mt-0.5" size={16} />
                      <div className="flex-1">
                        <p className="text-sm text-red-800">{insightsError}</p>
                        {insightsError.includes('limit') && (
                          <p className="text-xs text-red-600 mt-1">
                            Your daily limit resets in 24 hours. Try again tomorrow!
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {showInsights && insights && (
                    <div className="mt-4 space-y-4">
                      {/* Condition Summary */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Condition Summary</h4>
                        <p className="text-sm text-gray-700">{insights.condition_summary}</p>
                      </div>

                      {/* Fair Price Range */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Fair Price Range</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          ${insights.fair_price_range.min.toFixed(2)} - ${insights.fair_price_range.max.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Based on typical used textbook market prices for this edition and condition
                        </p>
                      </div>

                      {/* Insights */}
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
                        <ul className="space-y-2">
                          {insights.insights.map((insight: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-purple-600 mt-0.5">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        onClick={() => setShowInsights(false)}
                        variant="secondary"
                        className="w-full mt-4"
                      >
                        Hide Insights
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

