'use client'

import { useEffect } from 'react'
import Button from './Button'

interface ErrorDisplayProps {
  error: string | null
  onDismiss?: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
}

export default function ErrorDisplay({
  error,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
}: ErrorDisplayProps) {
  useEffect(() => {
    if (autoDismiss && error && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss()
      }, autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [error, autoDismiss, autoDismissDelay, onDismiss])

  if (!error) return null

  return (
    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 flex-shrink-0 text-red-400 hover:text-red-600 focus:outline-none"
            aria-label="Dismiss error"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

