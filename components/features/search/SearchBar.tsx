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
    <div className="relative w-full">
      <label htmlFor="search-input" className="sr-only">
        Search for books
      </label>
      <div className="flex">
        <input
          type="text"
          id="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 text-sm text-gray-900 rounded-l-md border-0 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="button"
          className="px-4 bg-orange-400 hover:bg-orange-500 text-gray-900 rounded-r-md transition-colors flex items-center justify-center"
          onClick={() => onSearch(query)}
        >
          <Search size={20} />
        </button>
      </div>
    </div>
  )
}
