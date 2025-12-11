'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  debounceMs?: number
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search by title, author, or course...',
  debounceMs = 300
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [query, onSearch, debounceMs])
  
  return (
    <div className="relative max-w-2xl mx-auto mb-4">
      <label htmlFor="search-input" className="sr-only">
        Search for books
      </label>
      <input
        type="text"
        id="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-12 text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors"
      />
      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
        <Search size={20} />
      </span>
    </div>
  )
}
