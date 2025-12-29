import { createClient } from '@/lib/supabase/client'
import type { Book, BookFormData, Filters } from '@/types'
import type { DatabaseBook } from '@/types/supabase'

// Helper function to convert database book to app book format
function dbBookToBook(dbBook: DatabaseBook): Book {
  return {
    id: dbBook.id,
    userId: dbBook.user_id,
    title: dbBook.title,
    author: dbBook.author,
    course: dbBook.course,
    price: dbBook.price,
    contact: dbBook.contact,
    poster: dbBook.poster || undefined,
    sold: dbBook.sold,
    category: dbBook.category || undefined,
    imageUrl: dbBook.image_url || undefined,
    createdAt: dbBook.created_at,
    updatedAt: dbBook.updated_at,
  }
}

// Helper function to convert app book to database format
function bookToDbFormat(book: BookFormData | Partial<Book>): Partial<DatabaseBook> {
  const dbBook: Partial<DatabaseBook> = {}
  
  if ('title' in book) dbBook.title = book.title
  if ('author' in book) dbBook.author = book.author
  if ('course' in book) dbBook.course = book.course
  if ('price' in book) dbBook.price = book.price
  if ('contact' in book) dbBook.contact = book.contact
  if ('poster' in book) dbBook.poster = book.poster || null
  if ('sold' in book) dbBook.sold = book.sold ?? false
  if ('category' in book) dbBook.category = book.category || null
  if ('imageUrl' in book) dbBook.image_url = book.imageUrl || null
  
  return dbBook
}

/**
 * Fetch all books from the database
 * Excludes sold books from public listings
 */
export async function getAllBooks(): Promise<Book[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('sold', false)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching books:', error)
    throw new Error(`Failed to fetch books: ${error.message}`)
  }
  
  if (!data) {
    return []
  }
  
  return data.map(dbBookToBook)
}

/**
 * Fetch a single book by ID
 */
export async function getBookById(id: string): Promise<Book | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching book:', error)
    throw new Error(`Failed to fetch book: ${error.message}`)
  }
  
  return dbBookToBook(data)
}

/**
 * Create a new book listing
 * Requires authentication
 */
export async function createBook(bookData: BookFormData): Promise<Book> {
  // Validate input
  if (!bookData.title?.trim()) {
    throw new Error('Book title is required')
  }
  if (!bookData.author?.trim()) {
    throw new Error('Author is required')
  }
  if (!bookData.course?.trim()) {
    throw new Error('Course is required')
  }
  if (!bookData.price?.trim()) {
    throw new Error('Price is required')
  }
  if (!bookData.contact?.trim()) {
    throw new Error('Contact information is required')
  }
  
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be signed in to create a book listing')
  }
  
  const dbBook = bookToDbFormat(bookData) as DatabaseBook
  
  const { data, error } = await supabase
    .from('books')
    .insert({
      ...dbBook,
      user_id: user.id,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating book:', error)
    throw new Error(`Failed to create book: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('Failed to create book: No data returned')
  }
  
  return dbBookToBook(data)
}

/**
 * Update a book listing
 * Only the owner can update their own book
 */
export async function updateBook(
  id: string,
  updates: Partial<BookFormData & { sold: boolean }>
): Promise<Book> {
  if (!id) {
    throw new Error('Book ID is required')
  }
  
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be signed in to update a book listing')
  }
  
  // Check if book exists and user owns it
  const existingBook = await getBookById(id)
  if (!existingBook) {
    throw new Error('Book not found')
  }
  
  if (existingBook.userId !== user.id) {
    throw new Error('You do not have permission to update this book')
  }
  
  const dbUpdates = bookToDbFormat(updates)
  
  // Don't allow empty updates
  if (Object.keys(dbUpdates).length === 0) {
    throw new Error('No updates provided')
  }
  
  const { data, error } = await supabase
    .from('books')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the book
    .select()
    .single()
  
  if (error) {
    console.error('Error updating book:', error)
    throw new Error(`Failed to update book: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('Book not found or you do not have permission to update it')
  }
  
  return dbBookToBook(data)
}

/**
 * Delete a book listing
 * Only the owner can delete their own book
 */
export async function deleteBook(id: string): Promise<void> {
  if (!id) {
    throw new Error('Book ID is required')
  }
  
  const supabase = createClient()
  
  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be signed in to delete a book listing')
  }
  
  // Check if book exists and user owns it
  const existingBook = await getBookById(id)
  if (!existingBook) {
    throw new Error('Book not found')
  }
  
  if (existingBook.userId !== user.id) {
    throw new Error('You do not have permission to delete this book')
  }
  
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // Ensure user owns the book
  
  if (error) {
    console.error('Error deleting book:', error)
    throw new Error(`Failed to delete book: ${error.message}`)
  }
}

/**
 * Mark a book as sold
 * Only the owner can mark their own book as sold
 */
export async function markAsSold(id: string): Promise<Book> {
  return updateBook(id, { sold: true })
}

/**
 * Unmark a book as sold (relist it)
 * Only the owner can unmark their own book as sold
 */
export async function markAsUnsold(id: string): Promise<Book> {
  return updateBook(id, { sold: false })
}

/**
 * Search and filter books
 */
export async function searchBooks(filters: Filters): Promise<Book[]> {
  const supabase = createClient()
  
  let query = supabase.from('books').select('*')
  
  // Search by query (title, author, or course)
  if (filters.query) {
    const searchTerm = filters.query.toLowerCase()
    query = query.or(
      `title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,course.ilike.%${searchTerm}%`
    )
  }
  
  // Filter by course
  if (filters.course) {
    query = query.ilike('course', `%${filters.course}%`)
  }
  
  // Filter by price range (if price is numeric)
  // Note: Since price is stored as TEXT, we'd need to parse it
  // For now, we'll skip price filtering or implement a more complex solution
  
  // Filter out sold books if needed (optional - you might want to show them)
  // query = query.eq('sold', false)
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error searching books:', error)
    throw new Error(`Failed to search books: ${error.message}`)
  }
  
  return data.map(dbBookToBook)
}

/**
 * Fetch books by a specific user ID
 * Requires authentication
 */
export async function getBooksByUserId(userId: string): Promise<Book[]> {
  if (!userId) {
    throw new Error('User ID is required')
  }
  
  const supabase = createClient()
  
  // Get current user to verify they're requesting their own books
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('You must be signed in to view your listings')
  }
  
  // Only allow users to fetch their own books
  if (user.id !== userId) {
    throw new Error('You can only view your own listings')
  }
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user books:', error)
    throw new Error(`Failed to fetch your listings: ${error.message}`)
  }
  
  if (!data) {
    return []
  }
  
  return data.map(dbBookToBook)
}

