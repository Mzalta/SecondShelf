import { createClient } from '@/lib/supabase/client'
import type { Book } from '@/types'

/**
 * Get all favorite book IDs for the current user
 */
export async function getFavoriteBookIds(): Promise<string[]> {
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    // Return empty array if not authenticated
    return []
  }
  
  const { data, error } = await supabase
    .from('favorites')
    .select('book_id')
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error fetching favorites:', error)
    throw new Error(`Failed to fetch favorites: ${error.message}`)
  }
  
  return data.map((fav: { book_id: string }) => fav.book_id)
}

/**
 * Get all favorite books for the current user
 */
export async function getFavoriteBooks(): Promise<Book[]> {
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    // Return empty array if not authenticated
    return []
  }
  
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      book_id,
      books (*)
    `)
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Error fetching favorite books:', error)
    throw new Error(`Failed to fetch favorite books: ${error.message}`)
  }
  
  // Transform the data - Supabase returns nested structure
  const favoriteBooks = data
    .map((item: any) => item.books)
    .filter((book: any) => book !== null)
    .map((book: any) => ({
      id: book.id,
      userId: book.user_id,
      title: book.title,
      author: book.author,
      course: book.course,
      price: book.price,
      contact: book.contact,
      poster: book.poster || undefined,
      sold: book.sold,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    }))
  
  return favoriteBooks
}

/**
 * Check if a book is favorited by the current user
 */
export async function isFavorite(bookId: string): Promise<boolean> {
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return false
  }
  
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - not favorited
      return false
    }
    console.error('Error checking favorite:', error)
    return false
  }
  
  return !!data
}

/**
 * Add a book to favorites
 * Requires authentication
 */
export async function addFavorite(bookId: string): Promise<void> {
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be signed in to add favorites')
  }
  
  // Check if already favorited
  const alreadyFavorite = await isFavorite(bookId)
  if (alreadyFavorite) {
    return // Already favorited, no need to add again
  }
  
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      book_id: bookId,
    })
  
  if (error) {
    console.error('Error adding favorite:', error)
    throw new Error(`Failed to add favorite: ${error.message}`)
  }
}

/**
 * Remove a book from favorites
 * Requires authentication
 */
export async function removeFavorite(bookId: string): Promise<void> {
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be signed in to remove favorites')
  }
  
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('book_id', bookId)
  
  if (error) {
    console.error('Error removing favorite:', error)
    throw new Error(`Failed to remove favorite: ${error.message}`)
  }
}

/**
 * Toggle favorite status of a book
 * Requires authentication
 */
export async function toggleFavorite(bookId: string): Promise<boolean> {
  const isFav = await isFavorite(bookId)
  
  if (isFav) {
    await removeFavorite(bookId)
    return false
  } else {
    await addFavorite(bookId)
    return true
  }
}

