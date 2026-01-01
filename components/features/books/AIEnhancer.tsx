'use client'

import { useState } from 'react'
import { enhanceListing, getRemainingEnhancements, type EnhancementResult } from '@/app/actions/enhanceListing'
import { useProStatus } from '@/lib/hooks/useProStatus'
import Button from '@/components/ui/Button'
import { Sparkles, Check, X, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface AIEnhancerProps {
  isbn?: string
  edition?: string
  conditionText: string
  currentTitle?: string
  currentDescription?: string
  onApplyTitle?: (title: string) => void
  onApplyDescription?: (description: string) => void
  onApplyBullets?: (bullets: string[]) => void
  onApplyKeywords?: (keywords: string[]) => void
  onApplyPriceRange?: (min: number, max: number) => void
}

export default function AIEnhancer({
  isbn,
  edition,
  conditionText,
  currentTitle,
  currentDescription,
  onApplyTitle,
  onApplyDescription,
  onApplyBullets,
  onApplyKeywords,
  onApplyPriceRange,
}: AIEnhancerProps) {
  const { isPro, loading: proLoading } = useProStatus()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EnhancementResult | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleEnhance = async () => {
    if (!conditionText.trim()) {
      setError('Please enter condition details first')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await enhanceListing({
        isbn: isbn?.trim() || undefined,
        edition: edition?.trim() || undefined,
        condition_text: conditionText.trim(),
        current_title: currentTitle?.trim() || undefined,
        current_description: currentDescription?.trim() || undefined,
      })

      if (response.success && response.data) {
        setResult(response.data)
        setRemaining(response.remaining || null)
        setShowPreview(true)
      } else {
        setError(response.error || 'Failed to enhance listing')
        setRemaining(response.remaining || null)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = () => {
    setResult(null)
    setShowPreview(false)
    handleEnhance()
  }

  if (proLoading) {
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Checking Pro status...</span>
        </div>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Sparkles className="text-purple-600 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">AI Listing Enhancer</h3>
            <p className="text-sm text-gray-700 mb-3">
              Upgrade to Pro to get AI-generated optimized titles, descriptions, bullet points, keywords, and price suggestions for your listings.
            </p>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="p-4 bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-600" size={20} />
            <h3 className="font-semibold text-gray-900">AI Listing Enhancer</h3>
          </div>
          {remaining !== null && (
            <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
              {remaining} uses remaining today
            </span>
          )}
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 mt-0.5" size={16} />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
              {error.includes('limit') && (
                <p className="text-xs text-red-600 mt-1">
                  Your daily limit resets in 24 hours. Try again tomorrow!
                </p>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {!showPreview && (
          <div>
            <p className="text-sm text-gray-700 mb-3">
              Get AI-generated optimized title, description, bullet points, keywords, and price suggestions based on your book details.
            </p>
            <Button
              onClick={handleEnhance}
              disabled={loading || !conditionText.trim()}
              variant="primary"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Enhance with AI
                </>
              )}
            </Button>
          </div>
        )}

        {showPreview && result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">AI Suggestions</h4>
              <Button
                onClick={handleRegenerate}
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Regenerate
                  </>
                )}
              </Button>
            </div>

            {/* Optimized Title */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Optimized Title</label>
                {onApplyTitle && (
                  <Button
                    onClick={() => {
                      onApplyTitle(result.optimized_title)
                      setShowPreview(false)
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Check size={14} />
                    Apply
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-900">{result.optimized_title}</p>
            </div>

            {/* Optimized Description */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Optimized Description</label>
                {onApplyDescription && (
                  <Button
                    onClick={() => {
                      onApplyDescription(result.optimized_description)
                      setShowPreview(false)
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Check size={14} />
                    Apply
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.optimized_description}</p>
            </div>

            {/* Bullet Points */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Key Features</label>
                {onApplyBullets && (
                  <Button
                    onClick={() => {
                      onApplyBullets(result.bullets)
                      setShowPreview(false)
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Check size={14} />
                    Apply
                  </Button>
                )}
              </div>
              <ul className="list-disc list-inside space-y-1">
                {result.bullets.map((bullet, idx) => (
                  <li key={idx} className="text-sm text-gray-700">{bullet}</li>
                ))}
              </ul>
            </div>

            {/* Keywords */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Keywords</label>
                {onApplyKeywords && (
                  <Button
                    onClick={() => {
                      onApplyKeywords(result.keywords)
                      setShowPreview(false)
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Check size={14} />
                    Apply
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Price Range */}
            {onApplyPriceRange && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Suggested Price Range</label>
                  <Button
                    onClick={() => {
                      onApplyPriceRange(result.price_min_usd, result.price_max_usd)
                      setShowPreview(false)
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    <Check size={14} />
                    Apply
                  </Button>
                </div>
                <p className="text-sm text-gray-700">
                  ${result.price_min_usd.toFixed(2)} - ${result.price_max_usd.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on typical used textbook market prices for this edition and condition
                </p>
              </div>
            )}

            <Button
              onClick={() => setShowPreview(false)}
              variant="secondary"
              className="w-full"
            >
              Close Preview
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

