'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Search, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
  debounceMs?: number
  isPro?: boolean
  showProTeaser?: boolean
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search by title, author, or course...',
  initialValue = '',
  debounceMs = 300,
  isPro = false,
  showProTeaser = false
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isUserTypingRef = useRef(false)
  const prevInitialValueRef = useRef(initialValue)
  
  // Sync with initialValue prop (e.g., from URL params) - only if it changed externally
  useEffect(() => {
    // Only update if initialValue changed and user isn't currently typing
    if (initialValue !== prevInitialValueRef.current) {
      if (!isUserTypingRef.current) {
        setQuery(initialValue)
      }
      prevInitialValueRef.current = initialValue
      // Reset typing flag when value changes externally (e.g., from URL navigation)
      isUserTypingRef.current = false
    }
  }, [initialValue])
  
  // Debounced search - triggers as user types (not on initialValue changes)
  useEffect(() => {
    // Only trigger debounced search if user is typing
    if (!isUserTypingRef.current) {
      return
    }
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onSearch(query)
      isUserTypingRef.current = false
    }, debounceMs)
    
    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, onSearch, debounceMs])
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    // Clear any pending debounce and search immediately
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    isUserTypingRef.current = false
    onSearch(query)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative w-full">
        <label htmlFor="search-input" className="sr-only">
          Search for books
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center relative">
            <input
              type="text"
              id="search-input"
              value={query}
              onChange={(e) => {
                isUserTypingRef.current = true
                setQuery(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder={isPro ? 'Try: "calculus book under $50 good condition with solutions"' : placeholder}
              className={`flex-1 px-4 py-2.5 text-sm text-gray-900 rounded-l-md border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isPro ? 'pl-28' : ''}`}
            />
            {isPro && (
              <div className="absolute left-2 flex items-center gap-1.5 pointer-events-none">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                  Smart
                </span>
              </div>
            )}
            <button
              type="submit"
              className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-r-md transition-colors flex items-center justify-center"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
      </form>
      
      {/* Pro Upgrade Teaser */}
      {showProTeaser && !isPro && (
        <div className="mt-2 text-xs text-gray-600">
          <Link 
            href="/subscription" 
            className="text-purple-600 hover:text-purple-700 font-medium hover:underline inline-flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Upgrade to Pro for AI-powered natural language search
          </Link>
          <span className="text-gray-500 ml-1">
            (e.g., "calculus book under $50 good condition with solutions")
          </span>
        </div>
      )}
    </div>
  )
}
