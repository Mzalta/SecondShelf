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

    // Define the categories we want to use - comprehensive list of college subjects
    const categories = [
      'STEM - Computer Science',
      'STEM - Mathematics',
      'STEM - Engineering',
      'STEM - Physics',
      'STEM - Chemistry',
      'STEM - Biology',
      'STEM - Health Sciences',
      'STEM - Medicine',
      'STEM - Nursing',
      'STEM - Environmental Science',
      'Humanities - Literature',
      'Humanities - History',
      'Humanities - Philosophy',
      'Humanities - Languages',
      'Humanities - Religious Studies',
      'Humanities - Classics',
      'Social Sciences - Psychology',
      'Social Sciences - Sociology',
      'Social Sciences - Economics',
      'Social Sciences - Political Science',
      'Social Sciences - Anthropology',
      'Social Sciences - Geography',
      'Social Sciences - Criminology',
      'Business - Management',
      'Business - Finance',
      'Business - Marketing',
      'Business - Accounting',
      'Business - Entrepreneurship',
      'Arts - Visual Arts',
      'Arts - Performing Arts',
      'Arts - Music',
      'Arts - Film Studies',
      'Arts - Design',
      'Education',
      'Law',
      'Communications',
      'Journalism',
      'Architecture',
      'Public Health'
    ]

    // Create the prompt for OpenAI
    const prompt = `Based on the following textbook information, categorize it into one of these academic categories:

Title: ${title}
Author: ${author}
Course: ${course}

Categories:
${categories.map((cat, idx) => `${idx + 1}. ${cat}`).join('\n')}

You must select one of the categories listed above. Do not use "Other" or create new categories. Respond with ONLY the exact category name from the list above. Do not include any explanation or additional text.`

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that categorizes academic textbooks into predefined categories. You must select one of the provided categories - never use "Other" or create new categories. Always respond with only the exact category name from the provided list.',
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
    // If not found, try to find the closest match or use the first category as fallback
    const validCategory = categories.find(
      (cat) => cat.toLowerCase() === category.toLowerCase()
    ) || categories.find(
      (cat) => category.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(category.toLowerCase())
    ) || categories[0] // Fallback to first category if no match found

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
