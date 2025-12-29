import { createClient } from '@/lib/supabase/server'

/**
 * Check if the current authenticated user has an active Pro subscription
 * @returns true if user is Pro, false otherwise
 */
export async function isUserPro(): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // Check if user has active subscription using the database function
    const { data, error } = await supabase
      .rpc('user_has_active_subscription', { user_uuid: user.id })

    if (error) {
      console.error('Error checking Pro status:', error)
      return false
    }

    return data === true
  } catch (error) {
    console.error('Error in isUserPro:', error)
    return false
  }
}

/**
 * Get the authenticated user's ID
 * @returns user ID or null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    return user.id
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

