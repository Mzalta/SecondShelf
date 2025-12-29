'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'

interface AISearchSummaryProps {
  summary: string
  onEditSearch?: () => void
}

export default function AISearchSummary({ summary, onEditSearch }: AISearchSummaryProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-purple-900">AI understood:</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              Smart Search
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{summary}</p>
          {onEditSearch && (
            <button
              onClick={onEditSearch}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline"
            >
              Edit search
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

