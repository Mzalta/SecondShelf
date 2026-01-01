import { NextRequest, NextResponse } from 'next/server'
import { seedListings } from '@/lib/seed/listings'

// Ensure this route runs on Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/seed-listings
 * Admin endpoint to seed the database with sample textbook listings
 * 
 * Protection: Requires SEED_SECRET_KEY in environment and request header
 * Usage: POST with header: { "X-Seed-Secret": "<your-seed-secret>" }
 * 
 * Example:
 *   curl -X POST https://your-app.vercel.app/api/admin/seed-listings \
 *     -H "X-Seed-Secret: your-secret-key"
 */
export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration is missing' },
        { status: 500 }
      )
    }

    // Security check: require secret key
    const seedSecret = process.env.SEED_SECRET_KEY
    if (seedSecret) {
      const providedSecret = request.headers.get('X-Seed-Secret')
      if (providedSecret !== seedSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid seed secret' },
          { status: 401 }
        )
      }
    } else {
      // Warn if no secret is set (not secure for production)
      console.warn('⚠️  SEED_SECRET_KEY not set - endpoint is unprotected!')
    }

    // Get optional query parameters
    const { searchParams } = new URL(request.url)
    const skipIfExists = searchParams.get('skipIfExists') !== 'false'
    const threshold = parseInt(searchParams.get('threshold') || '50', 10)

    console.log('🌱 Starting database seeding via API...')

    const result = await seedListings(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        skipIfExists,
        existingThreshold: threshold
      }
    )

    if (!result.success) {
      console.error('❌ Seeding failed:', result.error)
      return NextResponse.json(
        { 
          success: false,
          error: result.error 
        },
        { status: 500 }
      )
    }

    if (result.skipped) {
      console.log('⏭️  Seeding skipped:', result.message)
      return NextResponse.json({
        success: true,
        skipped: true,
        message: result.message
      })
    }

    console.log(`✅ Seeding complete: ${result.inserted} listings inserted`)

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      generated: result.generated,
      message: result.message
    })

  } catch (error: any) {
    console.error('❌ Error in seed endpoint:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/seed-listings
 * Get status/info about seeding
 */
export async function GET() {
  return NextResponse.json({
    message: 'Seed listings endpoint',
    usage: {
      method: 'POST',
      header: 'X-Seed-Secret: <your-seed-secret> (if SEED_SECRET_KEY is set)',
      queryParams: {
        skipIfExists: 'boolean (default: true) - skip if listings > threshold',
        threshold: 'number (default: 50) - threshold for skipping'
      }
    },
    example: 'POST /api/admin/seed-listings?skipIfExists=true&threshold=50',
    protected: !!process.env.SEED_SECRET_KEY
  })
}

