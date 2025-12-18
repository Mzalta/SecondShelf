import { create } from 'zustand'
import type { Book, BookFormData } from '@/types'
import type { User } from '@supabase/supabase-js'
import * as booksApi from '@/lib/api/books'
import * as favoritesApi from '@/lib/api/favorites'
import { handleApiError } from '@/lib/api/errors'

interface BookStore {
  // State
  listings: Book[]
  myBooks: Book[] // User's own listings
  favoriteIds: Set<string> // Changed from number[] to Set<string> for ID-based favorites
  currentUser: User | null
  loading: boolean
  error: string | null
  
  // Actions
  fetchBooks: () => Promise<void>
  fetchMyBooks: () => Promise<void>
  fetchFavorites: () => Promise<void>
  addListing: (bookData: BookFormData) => Promise<void>
  removeListing: (id: string) => Promise<void>
  toggleFavorite: (bookId: string) => Promise<void>
  markAsSold: (id: string) => Promise<void>
  setCurrentUser: (user: User | null) => void
  setError: (error: string | null) => void
  clearError: () => void
  isFavorite: (bookId: string) => boolean
}

export const useBookStore = create<BookStore>((set, get) => ({
  // Initial state
  listings: [],
  myBooks: [],
  favoriteIds: new Set<string>(),
  currentUser: null,
  loading: false,
  error: null,
  
  // Fetch all books from Supabase
  fetchBooks: async () => {
    set({ loading: true, error: null })
    try {
      const books = await booksApi.getAllBooks()
      set({ listings: books, loading: false })
    } catch (error) {
      const errorMessage = handleApiError(error)
      set({ error: errorMessage, loading: false })
      console.error('Error fetching books:', error)
    }
  },
  
  // Fetch current user's own books
  fetchMyBooks: async () => {
    const user = get().currentUser
    if (!user) {
      set({ myBooks: [], error: 'You must be signed in to view your listings' })
      return
    }
    
    set({ loading: true, error: null })
    try {
      const books = await booksApi.getBooksByUserId(user.id)
      set({ myBooks: books, loading: false })
    } catch (error) {
      const errorMessage = handleApiError(error)
      set({ error: errorMessage, loading: false, myBooks: [] })
      console.error('Error fetching user books:', error)
    }
  },
  
  // Fetch user's favorites
  fetchFavorites: async () => {
    set({ loading: true, error: null })
    try {
      const favoriteIds = await favoritesApi.getFavoriteBookIds()
      set({ 
        favoriteIds: new Set(favoriteIds),
        loading: false 
      })
    } catch (error) {
      const errorMessage = handleApiError(error)
      set({ error: errorMessage, loading: false })
      console.error('Error fetching favorites:', error)
    }
  },
  
  // Add a new book listing
  addListing: async (bookData: BookFormData) => {
    set({ loading: true, error: null })
    try {
      const newBook = await booksApi.createBook(bookData)
      set((state) => ({
        listings: [newBook, ...state.listings],
        myBooks: [newBook, ...state.myBooks],
        loading: false
      }))
    } catch (error) {
      const errorMessage = handleApiError(error)
      set({ error: errorMessage, loading: false })
      throw error // Re-throw so component can handle it
    }
  },
  
  // Remove a book listing
  removeListing: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await booksApi.deleteBook(id)
      set((state) => ({
        listings: state.listings.filter((book) => book.id !== id),
        myBooks: state.myBooks.filter((book) => book.id !== id),
        favoriteIds: new Set(
          Array.from(state.favoriteIds).filter((favId) => favId !== id)
        )
      }))
      set({ loading: false })
    } catch (error) {
      const errorMessage = handleApiError(error)
      set({ error: errorMessage, loading: false })
      throw error
    }
  },
  
  // Toggle favorite status
  toggleFavorite: async (bookId: string) => {
    set({ loading: true, error: null })
    try {
      const isNowFavorite = await favoritesApi.toggleFavorite(bookId)
      set((state) => {
        const newFavoriteIds = new Set(state.favoriteIds)
        if (isNowFavorite) {
          newFavoriteIds.add(bookId)
        } else {
          newFavoriteIds.delete(bookId)
        }
        return { favoriteIds: newFavoriteIds, loading: false }
      })
    } catch (error) {
      const errorMessage = handleApiError(error)
      set({ error: errorMessage, loading: false })
      // Don't throw - favorites are optional, just log the error
      console.error('Error toggling favorite:', error)
    }
  },
  
  // Mark a book as sold (removes it from listings)
  markAsSold: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await booksApi.markAsSold(id)
      set((state) => ({
        listings: state.listings.filter((book) => book.id !== id),
        myBooks: state.myBooks.filter((book) => book.id !== id),
        favoriteIds: new Set(
          Array.from(state.favoriteIds).filter((favId) => favId !== id)
        )
      }))
      set({ loading: false })
    } catch (error) {
      const errorMessage = handleApiError(error)
      set({ error: errorMessage, loading: false })
      throw error
    }
  },
  
  // Set current authenticated user
  setCurrentUser: (user: User | null) => {
    set({ currentUser: user })
    // If user logs out, clear favorites
    if (!user) {
      set({ favoriteIds: new Set<string>() })
    }
  },
  
  // Set error message
  setError: (error: string | null) => set({ error }),
  
  // Clear error message
  clearError: () => set({ error: null }),
  
  // Check if a book is favorited
  isFavorite: (bookId: string) => {
    return get().favoriteIds.has(bookId)
  },
}))
