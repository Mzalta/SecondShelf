/**
 * API utility for book categorization using OpenAI
 */

export interface CategorizeRequest {
  title: string
  author: string
  course: string
}

export interface CategorizeResponse {
  category: string
}

/**
 * Calls the OpenAI API to categorize a book based on title, author, and course
 * @param data - Book information (title, author, course)
 * @returns Promise with the categorized category
 */
export async function categorizeBook(
  data: CategorizeRequest
): Promise<string> {
  try {
    const response = await fetch('/api/books/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to categorize book')
    }

    const result: CategorizeResponse = await response.json()
    return result.category
  } catch (error: any) {
    console.error('Error categorizing book:', error)
    throw error
  }
}
