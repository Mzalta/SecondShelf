/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Handle Supabase errors and convert to user-friendly messages
 */
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()
    
    // Authentication errors
    if (errorMessage.includes('jwt') || errorMessage.includes('token') || errorMessage.includes('session')) {
      return 'Your session has expired. Please sign in again.'
    }
    
    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('row-level security')) {
      return 'You do not have permission to perform this action. Make sure you are signed in and own this item.'
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.'
    }
    
    // Database constraint errors
    if (errorMessage.includes('foreign key')) {
      return 'This item is referenced by other data and cannot be deleted.'
    }
    
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return 'This item already exists.'
    }
    
    if (errorMessage.includes('not null') || errorMessage.includes('required')) {
      return 'Required information is missing. Please fill in all fields.'
    }
    
    // Not found errors
    if (errorMessage.includes('not found') || errorMessage.includes('no rows')) {
      return 'The requested item could not be found.'
    }
    
    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    
    // Return the original message if it's user-friendly, otherwise generic message
    if (errorMessage.length < 100) {
      return error.message
    }
    
    return 'An unexpected error occurred. Please try again.'
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Check if error is a network error that might be retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()
    return (
      errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout')
    )
  }
  return false
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

