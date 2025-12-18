'use client'

import { useState, KeyboardEvent } from 'react'
import { Search } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  initialValue?: string
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search by title, author, or course...',
  initialValue = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onSearch(query)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <label htmlFor="search-input" className="sr-only">
        Search for books
      </label>
      <div className="flex">
        <input
          type="text"
          id="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 text-sm text-gray-900 rounded-l-md border-0 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button
          type="submit"
          className="px-4 bg-orange-400 hover:bg-orange-500 text-gray-900 rounded-r-md transition-colors flex items-center justify-center"
        >
          <Search size={20} />
        </button>
      </div>
    </form>
  )
}
