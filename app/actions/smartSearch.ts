'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import OpenAI from 'openai'
import type { Book } from '@/types'

// Zod schema for AI-extracted search filters
const SearchFiltersSchema = z.object({
  keywords: z.array(z.string()).default([]),
  subject: z.string().nullable().optional(),
  edition: z.string().nullable().optional(),
  min_price: z.number().nullable().optional(),
  max_price: z.number().nullable().optional(),
  condition: z.array(z.string()).nullable().optional(),
  has_solutions_manual: z.boolean().nullable().optional(),
  has_access_code: z.boolean().nullable().optional(),
  no_highlights: z.boolean().nullable().optional(),
  sort_by: z.enum(['price_asc', 'price_desc', 'newest', 'relevance']).nullable().optional(),
})

type SearchFilters = z.infer<typeof SearchFiltersSchema>

interface SmartSearchResult {
  books: Book[]
  aiUsed: boolean
  aiSummary?: string
  rateLimited?: boolean
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Helper to extract numeric price from string (e.g., "$50" -> 50)
function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null
  // Remove $, commas, and whitespace, then parse
  const cleaned = priceStr.replace(/[$,\s]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

// Helper to build AI summary of filters
function buildAISummary(filters: SearchFilters): string {
  const parts: string[] = []
  
  if (filters.keywords && filters.keywords.length > 0) {
    parts.push(filters.keywords.join(', '))
  }
  
  if (filters.subject) {
    parts.push(`${filters.subject} textbooks`)
  }
  
  if (filters.edition) {
    parts.push(`Edition: ${filters.edition}`)
  }
  
  if (filters.min_price || filters.max_price) {
    if (filters.min_price && filters.max_price) {
      parts.push(`$${filters.min_price}-$${filters.max_price}`)
    } else if (filters.min_price) {
      parts.push(`$${filters.min_price}+`)
    } else if (filters.max_price) {
      parts.push(`Under $${filters.max_price}`)
    }
  }
  
  if (filters.condition && filters.condition.length > 0) {
    parts.push(`Condition: ${filters.condition.join(' or ')}`)
  }
  
  if (filters.has_solutions_manual === true) {
    parts.push('With solutions manual')
  }
  
  if (filters.has_access_code === true) {
    parts.push('With access code')
  }
  
  if (filters.no_highlights === true) {
    parts.push('No highlighting')
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'No specific filters'
}

// Basic keyword search (for non-Pro users or fallback)
async function basicKeywordSearch(query: string): Promise<Book[]> {
  const supabase = createClient()
  
  const searchTerm = query.toLowerCase().trim()
  if (!searchTerm) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('sold', false)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(convertDbBookToBook)
  }
  
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('sold', false)
    .or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%,course.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return (data || []).map(convertDbBookToBook)
}

// Convert database book to app Book type
function convertDbBookToBook(dbBook: any): Book {
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
    isbn: dbBook.isbn || undefined,
    edition: dbBook.edition || undefined,
    condition_text: dbBook.condition_text || undefined,
    description: dbBook.description || undefined,
    tags: dbBook.tags || undefined,
    createdAt: dbBook.created_at,
    updatedAt: dbBook.updated_at,
  }
}

// Check and update rate limiting
async function checkAndUpdateRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = createClient()
  const DAILY_LIMIT = 75
  
  // Get current profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('ai_searches_used, ai_searches_last_reset')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile for rate limit:', error)
    // If profile doesn't exist yet, allow but create it
    return { allowed: true, remaining: DAILY_LIMIT }
  }
  
  const now = new Date()
  const lastReset = profile?.ai_searches_last_reset ? new Date(profile.ai_searches_last_reset) : null
  
  // Check if we need to reset (more than 24 hours since last reset)
  let searchesUsed = profile?.ai_searches_used || 0
  if (!lastReset || (now.getTime() - lastReset.getTime()) > 24 * 60 * 60 * 1000) {
    // Reset counter
    searchesUsed = 0
    await supabase
      .from('profiles')
      .update({
        ai_searches_used: 0,
        ai_searches_last_reset: now.toISOString(),
      })
      .eq('id', userId)
  }
  
  // Check if limit exceeded
  if (searchesUsed >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 }
  }
  
  // Increment counter
  const newCount = searchesUsed + 1
  await supabase
    .from('profiles')
    .update({
      ai_searches_used: newCount,
      ai_searches_last_reset: lastReset ? profile.ai_searches_last_reset : now.toISOString(),
    })
    .eq('id', userId)
  
  return { allowed: true, remaining: DAILY_LIMIT - newCount }
}

// Extract filters from natural language using OpenAI
async function extractFiltersFromQuery(query: string): Promise<SearchFilters> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }
  
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
  
  const systemPrompt = `You are an expert textbook marketplace search assistant. Extract structured filters from the user's natural language query about textbooks. Only use fields that exist in the database. Output valid JSON only, no extra text.`
  
  const userPrompt = `Possible fields:
- keywords: array of strings to search in title and description (extract key search terms)
- subject: exact string (e.g., 'Biology', 'Calculus', 'Psychology', 'Computer Science', 'Chemistry')
- edition: string (e.g., '10th', '2nd Edition', '5th edition')
- min_price: number (extract minimum price from phrases like "over $50", "at least $30")
- max_price: number (extract maximum price from phrases like "under $50", "less than $100", "below $75")
- condition: array of strings from ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'] (match to these exact values based on user intent)
- has_solutions_manual: true/false/null (true if user mentions solutions manual, false if explicitly says no, null otherwise)
- has_access_code: true/false/null (true if user mentions access code, false if explicitly says no, null otherwise)
- no_highlights: true/false/null (true if user wants no highlighting/writing, false if they want highlighting, null otherwise)
- sort_by: one of 'price_asc', 'price_desc', 'newest', 'relevance' (default to 'relevance' if not specified)

User query: ${query}

Return JSON only with the extracted filters.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })
    
    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }
    
    const parsed = JSON.parse(content)
    const validated = SearchFiltersSchema.parse(parsed)
    return validated
  } catch (error) {
    console.error('Error extracting filters from OpenAI:', error)
    throw error
  }
}

// Build dynamic Supabase query from filters
async function buildQueryFromFilters(filters: SearchFilters): Promise<Book[]> {
  const supabase = createClient()
  let query = supabase.from('books').select('*').eq('sold', false)
  
  // Keywords: search in title, description, course
  if (filters.keywords && filters.keywords.length > 0) {
    // Build OR conditions for each keyword across multiple fields
    const keywordOrs = filters.keywords
      .map(kw => `title.ilike.%${kw}%,description.ilike.%${kw}%,course.ilike.%${kw}%`)
    // Combine all keyword ORs with AND (each keyword must match somewhere)
    if (keywordOrs.length === 1) {
      query = query.or(keywordOrs[0])
    } else {
      // For multiple keywords, we need to ensure at least one field matches for each keyword
      // This is complex with Supabase, so we'll do a simpler approach: match any keyword in any field
      const allConditions = keywordOrs.join(',')
      query = query.or(allConditions)
    }
  }
  
  // Subject (category)
  if (filters.subject) {
    query = query.ilike('category', `%${filters.subject}%`)
  }
  
  // Edition
  if (filters.edition) {
    query = query.ilike('edition', `%${filters.edition}%`)
  }
  
  // Price range - need to parse price strings
  // Since price is stored as TEXT, we'll filter in memory after fetching
  // Or use a more complex approach - for now, fetch all and filter client-side
  
  // Condition - search in condition_text field
  if (filters.condition && filters.condition.length > 0) {
    // Match any of the specified conditions
    const conditionOr = filters.condition
      .map(cond => `condition_text.ilike.%${cond}%`)
      .join(',')
    query = query.or(conditionOr)
  }
  
  // Note: has_solutions_manual, has_access_code, no_highlights would need
  // database columns that don't exist yet. For now, we'll search in description/tags
  
  if (filters.has_solutions_manual === true) {
    query = query.or('description.ilike.%solution%,description.ilike.%solutions manual%')
  }
  
  if (filters.has_access_code === true) {
    query = query.or('description.ilike.%access code%,description.ilike.%access code included%')
  }
  
  if (filters.no_highlights === true) {
    query = query.or('condition_text.ilike.%no highlight%,condition_text.ilike.%no writing%,condition_text.ilike.%clean%,condition_text.ilike.%unmarked%')
  }
  
  // Sorting
  if (filters.sort_by === 'price_asc' || filters.sort_by === 'price_desc') {
    // Can't sort by price directly since it's TEXT, will sort in memory
  } else if (filters.sort_by === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error building query from filters:', error)
    throw error
  }
  
  let books = (data || []).map(convertDbBookToBook)
  
  // Filter by price range in memory (since price is TEXT)
  if (filters.min_price || filters.max_price) {
    books = books.filter(book => {
      const price = parsePrice(book.price)
      if (price === null) return true // Include if price can't be parsed
      
      if (filters.min_price && price < filters.min_price) return false
      if (filters.max_price && price > filters.max_price) return false
      return true
    })
  }
  
  // Sort by price if requested
  if (filters.sort_by === 'price_asc') {
    books.sort((a, b) => {
      const priceA = parsePrice(a.price) || Infinity
      const priceB = parsePrice(b.price) || Infinity
      return priceA - priceB
    })
  } else if (filters.sort_by === 'price_desc') {
    books.sort((a, b) => {
      const priceA = parsePrice(a.price) || 0
      const priceB = parsePrice(b.price) || 0
      return priceB - priceA
    })
  }
  
  return books
}

// Helper to get user profile with is_pro
async function getUserProfile(userId: string): Promise<{ is_pro: boolean } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return { is_pro: data.is_pro }
}

// Main smart search function
export async function smartSearch(
  query: string
): Promise<SmartSearchResult> {
  const supabase = createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    // No user - use basic search
    const books = await basicKeywordSearch(query)
    return { books, aiUsed: false }
  }
  
  // Get user profile to check is_pro
  const profile = await getUserProfile(user.id)
  const isPro = profile?.is_pro ?? false
  try {
    // If not Pro, use basic search
    if (!isPro) {
      const books = await basicKeywordSearch(query)
      return { books, aiUsed: false }
    }
    
    // Check rate limiting
    const rateLimit = await checkAndUpdateRateLimit(user.id)
    if (!rateLimit.allowed) {
      // Rate limited - fall back to basic search
      const books = await basicKeywordSearch(query)
      return {
        books,
        aiUsed: false,
        rateLimited: true,
      }
    }
    
    // Try AI extraction
    let filters: SearchFilters
    let aiSummary: string | undefined
    
    try {
      filters = await extractFiltersFromQuery(query)
      aiSummary = buildAISummary(filters)
      
      // If no meaningful filters extracted, fall back to basic search
      if (
        (!filters.keywords || filters.keywords.length === 0) &&
        !filters.subject &&
        !filters.edition &&
        !filters.min_price &&
        !filters.max_price &&
        (!filters.condition || filters.condition.length === 0) &&
        filters.has_solutions_manual === undefined &&
        filters.has_access_code === undefined &&
        filters.no_highlights === undefined
      ) {
        // No filters extracted, use basic search
        const books = await basicKeywordSearch(query)
        return { books, aiUsed: false }
      }
      
      // Build query from filters
      const books = await buildQueryFromFilters(filters)
      return {
        books,
        aiUsed: true,
        aiSummary,
      }
    } catch (aiError) {
      // OpenAI failed - fall back to basic search
      console.error('AI search failed, falling back to basic search:', aiError)
      const books = await basicKeywordSearch(query)
      return {
        books,
        aiUsed: false,
      }
    }
  } catch (error) {
    console.error('Error in smartSearch:', error)
    // Final fallback to basic search
    const books = await basicKeywordSearch(query)
    return {
      books,
      aiUsed: false,
    }
  }
}

