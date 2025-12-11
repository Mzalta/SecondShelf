'use client'

import { useState } from 'react'
import { useBookStore } from '@/lib/store/useBookStore'
import { useSearch } from '@/lib/hooks/useSearch'
import BookList from '@/components/features/books/BookList'
import SearchBar from '@/components/features/search/SearchBar'
import ResultsCount from '@/components/features/search/ResultsCount'

export default function HomePage() {
  const { listings, favorites, currentUser, toggleFavorite, markAsSold } = useBookStore()
  const [searchQuery, setSearchQuery] = useState('')
  const filteredBooks = useSearch(listings, searchQuery)
  
  return (
    <>
      {/* Hero Section */}
      <section className="text-center py-12 px-4 mb-8 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg">
        <h2 className="text-4xl font-bold mb-4">Trade & Sell Your Textbooks</h2>
        <p className="text-xl opacity-90">
          Connect with students on campus to find the books you need at affordable prices
        </p>
      </section>

      {/* Search Section */}
      <section className="mb-8">
        <SearchBar onSearch={setSearchQuery} />
        <ResultsCount count={filteredBooks.length} total={listings.length} />
      </section>

      {/* Book Listings Section */}
      <section>
        <h2 className="text-3xl font-bold mb-6">Available Textbooks</h2>
        <BookList
          books={filteredBooks}
          favorites={favorites}
          currentUser={currentUser}
          onToggleFavorite={toggleFavorite}
          onMarkAsSold={markAsSold}
        />
      </section>
    </>
  )
}
