'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import OpenAI from 'openai'

// Zod schema for OpenAI response
const EnhancementResponseSchema = z.object({
  optimized_title: z.string(),
  optimized_description: z.string().min(100).max(500),
  bullets: z.array(z.string()).min(5).max(8),
  keywords: z.array(z.string()).min(10).max(15),
  price_min_usd: z.number().positive(),
  price_max_usd: z.number().positive(),
})

export type EnhancementResult = z.infer<typeof EnhancementResponseSchema>

// Input schema
const EnhancementInputSchema = z.object({
  isbn: z.string().optional(),
  edition: z.string().optional(),
  condition_text: z.string(),
  current_title: z.string().optional(),
  current_description: z.string().optional(),
})

const DAILY_LIMIT = 20

/**
 * Check if user has Pro status and rate limit available
 */
async function checkProAndRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; error?: string }> {
  const supabase = createClient()
  
  // Check if user has Pro subscription
  const { data: subscriptionData, error: subError } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .single()
  
  if (subError || !subscriptionData) {
    return { allowed: false, remaining: 0, error: 'No active Pro subscription found' }
  }
  
  const isActive = subscriptionData.status === 'active' || subscriptionData.status === 'trialing'
  const isNotExpired = new Date(subscriptionData.current_period_end) > new Date()
  
  if (!isActive || !isNotExpired) {
    return { allowed: false, remaining: 0, error: 'Pro subscription is not active' }
  }
  
  // Get or create profile
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('ai_enhancements_used, last_reset')
    .eq('id', userId)
    .single()
  
  // Create profile if it doesn't exist
  if (profileError && profileError.code === 'PGRST116') {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        is_pro: true,
        ai_enhancements_used: 0,
        last_reset: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (createError) {
      return { allowed: false, remaining: 0, error: 'Failed to create profile' }
    }
    profile = newProfile
  } else if (profileError) {
    return { allowed: false, remaining: 0, error: 'Failed to fetch profile' }
  }
  
  // Reset counter if it's been more than 24 hours
  const lastReset = profile.last_reset ? new Date(profile.last_reset) : new Date()
  const now = new Date()
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)
  
  let used = profile.ai_enhancements_used || 0
  if (hoursSinceReset >= 24) {
    // Reset the counter
    await supabase
      .from('profiles')
      .update({
        ai_enhancements_used: 0,
        last_reset: now.toISOString(),
      })
      .eq('id', userId)
    used = 0
  }
  
  const remaining = Math.max(0, DAILY_LIMIT - used)
  
  if (used >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, error: `Daily limit of ${DAILY_LIMIT} enhancements reached. Reset in ${Math.ceil(24 - hoursSinceReset)} hours.` }
  }
  
  return { allowed: true, remaining }
}

/**
 * Increment AI usage counter
 */
async function incrementUsage(userId: string): Promise<void> {
  const supabase = createClient()
  
  // Get current usage
  const { data: profile } = await supabase
    .from('profiles')
    .select('ai_enhancements_used')
    .eq('id', userId)
    .single()
  
  const currentUsage = profile?.ai_enhancements_used || 0
  
  // Increment
  await supabase
    .from('profiles')
    .update({
      ai_enhancements_used: currentUsage + 1,
    })
    .eq('id', userId)
}

/**
 * Enhance a textbook listing using OpenAI
 */
export async function enhanceListing(
  input: z.infer<typeof EnhancementInputSchema>
): Promise<{ success: boolean; data?: EnhancementResult; error?: string; remaining?: number }> {
  try {
    // Validate input
    const validatedInput = EnhancementInputSchema.parse(input)
    
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Check Pro status and rate limit
    const { allowed, remaining, error } = await checkProAndRateLimit(user.id)
    if (!allowed) {
      return { success: false, error: error || 'Pro subscription required', remaining }
    }
    
    // Check OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' }
    }
    
    // Build prompt
    const systemPrompt = `You are an expert textbook marketplace listing optimizer. Your goal is to help sellers create honest, engaging, and effective listings that accurately represent the book's condition while maximizing appeal. Always prioritize transparency about condition. Output only valid JSON, no markdown formatting.`
    
    const userPrompt = `Generate an optimized textbook listing based on these details:

${validatedInput.isbn ? `ISBN: ${validatedInput.isbn}` : ''}
${validatedInput.edition ? `Edition: ${validatedInput.edition}` : ''}
Condition: ${validatedInput.condition_text}
${validatedInput.current_title ? `Current Title: ${validatedInput.current_title}` : ''}
${validatedInput.current_description ? `Current Description: ${validatedInput.current_description}` : ''}

Generate the following JSON structure:
{
  "optimized_title": "A clear, concise title (60-80 characters) that includes key details like edition if relevant",
  "optimized_description": "An engaging description (300-500 characters) that honestly describes the condition, highlights key features, and makes the listing appealing. Be transparent about any wear or damage mentioned in the condition.",
  "bullets": ["5-8 bullet points", "Each highlighting key features", "Edition information", "Condition details", "Why it's a good value", "Any included materials"],
  "keywords": ["10-15 relevant keywords", "For search optimization", "Include subject area", "Course codes if applicable", "Edition year", "Author name variations"],
  "price_min_usd": 0,
  "price_max_usd": 0
}

For price_min_usd and price_max_usd, estimate a fair market price range for a used textbook in this condition. Consider:
- Typical used textbook prices for this edition
- Condition impact on value
- Market standards for similar listings

Output ONLY valid JSON, no additional text or markdown.`
    
    // Call OpenAI
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    
    const content = completion.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: 'No response from OpenAI' }
    }
    
    // Parse and validate response
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      return { success: false, error: 'Invalid JSON response from OpenAI' }
    }
    
    const validated = EnhancementResponseSchema.parse(parsed)
    
    // Increment usage counter
    await incrementUsage(user.id)
    
    // Get updated remaining count
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('ai_enhancements_used')
      .eq('id', user.id)
      .single()
    
    const updatedRemaining = Math.max(0, DAILY_LIMIT - (updatedProfile?.ai_enhancements_used || 0))
    
    return { success: true, data: validated, remaining: updatedRemaining }
  } catch (error: any) {
    console.error('Error enhancing listing:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` }
    }
    
    return { success: false, error: error.message || 'Failed to enhance listing' }
  }
}

/**
 * Get AI insights for a buyer viewing a listing
 */
export async function getBuyerInsights(
  listingId: string
): Promise<{ success: boolean; data?: { condition_summary: string; fair_price_range: { min: number; max: number }; insights: string[] }; error?: string; remaining?: number }> {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Check Pro status and rate limit
    const { allowed, remaining, error } = await checkProAndRateLimit(user.id)
    if (!allowed) {
      return { success: false, error: error || 'Pro subscription required', remaining }
    }
    
    // Fetch listing
    const { data: listing, error: listingError } = await supabase
      .from('books')
      .select('*')
      .eq('id', listingId)
      .single()
    
    if (listingError || !listing) {
      return { success: false, error: 'Listing not found' }
    }
    
    // Check OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' }
    }
    
    // Build prompt for buyer insights
    const systemPrompt = `You are an expert textbook marketplace advisor helping buyers evaluate listings. Provide honest, helpful insights about condition and fair pricing. Output only valid JSON, no markdown formatting.`
    
    const userPrompt = `Analyze this textbook listing for a buyer:

Title: ${listing.title}
Author: ${listing.author}
Course: ${listing.course}
Price: ${listing.price}
${listing.isbn ? `ISBN: ${listing.isbn}` : ''}
${listing.edition ? `Edition: ${listing.edition}` : ''}
${listing.condition_text ? `Condition: ${listing.condition_text}` : 'Condition: Not specified'}
${listing.description ? `Description: ${listing.description}` : ''}

Generate buyer insights as JSON:
{
  "condition_summary": "A concise summary (100-200 characters) of the book's condition based on the provided information",
  "fair_price_range": {
    "min": 0,
    "max": 0
  },
  "insights": ["3-5 helpful insights", "About the listing", "Condition assessment", "Price evaluation", "Value proposition"]
}

For fair_price_range, estimate a reasonable price range for this book in this condition based on typical used textbook market prices.

Output ONLY valid JSON, no additional text or markdown.`
    
    // Call OpenAI
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    
    const content = completion.choices[0]?.message?.content
    if (!content) {
      return { success: false, error: 'No response from OpenAI' }
    }
    
    // Parse response
    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      return { success: false, error: 'Invalid JSON response from OpenAI' }
    }
    
    // Validate response structure
    const insightsSchema = z.object({
      condition_summary: z.string(),
      fair_price_range: z.object({
        min: z.number().positive(),
        max: z.number().positive(),
      }),
      insights: z.array(z.string()).min(3).max(5),
    })
    
    const validated = insightsSchema.parse(parsed)
    
    // Increment usage counter
    await incrementUsage(user.id)
    
    // Get updated remaining count
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('ai_enhancements_used')
      .eq('id', user.id)
      .single()
    
    const updatedRemaining = Math.max(0, DAILY_LIMIT - (updatedProfile?.ai_enhancements_used || 0))
    
    return { success: true, data: validated, remaining: updatedRemaining }
  } catch (error: any) {
    console.error('Error getting buyer insights:', error)
    
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation error: ${error.errors.map(e => e.message).join(', ')}` }
    }
    
    return { success: false, error: error.message || 'Failed to get insights' }
  }
}

/**
 * Get remaining AI enhancements for current user
 */
export async function getRemainingEnhancements(): Promise<{ remaining: number; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { remaining: 0, error: 'Authentication required' }
    }
    
    const { allowed, remaining } = await checkProAndRateLimit(user.id)
    if (!allowed) {
      return { remaining: 0 }
    }
    
    return { remaining }
  } catch (error: any) {
    console.error('Error getting remaining enhancements:', error)
    return { remaining: 0, error: error.message }
  }
}

