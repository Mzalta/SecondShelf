// Database types for Supabase
// These types match the database schema

export interface DatabaseBook {
  id: string
  user_id: string | null
  title: string
  author: string
  course: string
  price: string
  contact: string
  poster: string | null
  sold: boolean
  created_at: string
  updated_at: string
}

export interface DatabaseFavorite {
  id: string
  user_id: string
  book_id: string
  created_at: string
}

// Helper type to convert database book to app book format
export type BookFromDB = Omit<DatabaseBook, 'created_at' | 'updated_at'> & {
  createdAt: string
  updatedAt: string
}

