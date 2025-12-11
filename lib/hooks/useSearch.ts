import { useMemo } from 'react'
import { Book } from '@/types'

export function useSearch(books: Book[], query: string) {
  const filteredBooks = useMemo(() => {
    if (!query.trim()) {
      return books
    }
    
    const lowerQuery = query.toLowerCase().trim()
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(lowerQuery) ||
        book.author.toLowerCase().includes(lowerQuery) ||
        book.course.toLowerCase().includes(lowerQuery)
    )
  }, [books, query])
  
  return filteredBooks
}
