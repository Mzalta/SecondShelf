import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * POST /api/books/categorize
 * Categorizes a book based on title, author, and course information
 * Returns a category from predefined academic categories
 */
export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // Initialize OpenAI client lazily (only when route is called, not during build)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const body = await request.json()
    const { title, author, course } = body

    // Validate input
    if (!title || !author || !course) {
      return NextResponse.json(
        { error: 'Title, author, and course are required' },
        { status: 400 }
      )
    }

    // Define the categories we want to use
    const categories = [
      'STEM - Computer Science',
      'STEM - Mathematics',
      'STEM - Engineering',
      'STEM - Natural Sciences',
      'STEM - Health Sciences',
      'Humanities - Literature',
      'Humanities - History',
      'Humanities - Philosophy',
      'Humanities - Languages',
      'Social Sciences - Psychology',
      'Social Sciences - Sociology',
      'Social Sciences - Economics',
      'Social Sciences - Political Science',
      'Business - Management',
      'Business - Finance',
      'Business - Marketing',
      'Arts - Visual Arts',
      'Arts - Performing Arts',
      'Education',
      'Other'
    ]

    // Create the prompt for OpenAI
    const prompt = `Based on the following textbook information, categorize it into one of these academic categories:

Title: ${title}
Author: ${author}
Course: ${course}

Categories:
${categories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

Respond with ONLY the category name from the list above. Do not include any explanation or additional text.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that categorizes academic textbooks into predefined categories. Always respond with only the category name from the provided list.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent categorization
      max_tokens: 50,
    })

    const category = completion.choices[0]?.message?.content?.trim()

    if (!category) {
      return NextResponse.json(
        { error: 'Failed to generate category' },
        { status: 500 }
      )
    }

    // Validate that the category is in our list
    const validCategory = categories.find(
      (cat) => cat.toLowerCase() === category.toLowerCase()
    ) || 'Other'

    return NextResponse.json({
      category: validCategory,
    })
  } catch (error: any) {
    console.error('Error categorizing book:', error)
    
    // Handle OpenAI API errors
    if (error.response) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.response.statusText}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to categorize book' },
      { status: 500 }
    )
  }
}
