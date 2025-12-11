import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Book } from '@/types'

interface BookStore {
  listings: Book[]
  favorites: number[]
  currentUser: string
  
  // Actions
  addListing: (book: Book) => void
  removeListing: (index: number) => void
  toggleFavorite: (index: number) => void
  markAsSold: (index: number) => void
  setCurrentUser: (user: string) => void
  setListings: (listings: Book[]) => void
}

export const useBookStore = create<BookStore>()(
  persist(
    (set) => ({
      listings: [],
      favorites: [],
      currentUser: 'Guest',
      
      addListing: (book) =>
        set((state) => ({
          listings: [...state.listings, { ...book, id: Date.now().toString() }]
        })),
      
      removeListing: (index) =>
        set((state) => {
          const newListings = state.listings.filter((_, i) => i !== index)
          const newFavorites = state.favorites
            .filter((favIndex) => favIndex !== index)
            .map((favIndex) => (favIndex > index ? favIndex - 1 : favIndex))
          return {
            listings: newListings,
            favorites: newFavorites
          }
        }),
      
      toggleFavorite: (index) =>
        set((state) => {
          const favoriteIndex = state.favorites.indexOf(index)
          if (favoriteIndex > -1) {
            return {
              favorites: state.favorites.filter((i) => i !== index)
            }
          } else {
            return {
              favorites: [...state.favorites, index]
            }
          }
        }),
      
      markAsSold: (index) =>
        set((state) => {
          const newListings = state.listings.filter((_, i) => i !== index)
          const newFavorites = state.favorites
            .filter((favIndex) => favIndex !== index)
            .map((favIndex) => (favIndex > index ? favIndex - 1 : favIndex))
          return {
            listings: newListings,
            favorites: newFavorites
          }
        }),
      
      setCurrentUser: (user) => set({ currentUser: user }),
      
      setListings: (listings) => set({ listings })
    }),
    {
      name: 'book-storage'
    }
  )
)
