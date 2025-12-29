/**
 * Database seeding script for textbook listings
 * 
 * This script populates the books table with 150-200 realistic sample textbook listings
 * for development/testing/demo purposes.
 * 
 * Usage:
 *   npx tsx scripts/seed-listings.ts
 *   or
 *   npm run seed:listings
 * 
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in environment
 *   - NEXT_PUBLIC_SUPABASE_URL must be set in environment
 *   - Only run in development/test environments
 * 
 * The script is idempotent: it will skip seeding if more than 50 listings already exist.
 * 
 * For Vercel/production, use the API endpoint instead:
 *   POST /api/admin/seed-listings
 */

import * as dotenv from 'dotenv'
// Use relative path for scripts (tsx may not resolve @ alias)
import { seedListings } from '../lib/seed/listings'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Environment check
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Please check your .env.local file')
  process.exit(1)
}

// Development environment check
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Error: This script should only be run in development/test environments')
  console.error('   For production/Vercel, use the API endpoint: POST /api/admin/seed-listings')
  process.exit(1)
}

// Main seeding function
async function runSeed() {
  console.log('🌱 Starting database seeding...\n')

  const result = await seedListings(
    supabaseUrl,
    supabaseServiceKey,
    {
      skipIfExists: true,
      existingThreshold: 50
    }
  )

  if (!result.success) {
    console.error('\n❌ Error during seeding:', result.error)
    process.exit(1)
  }

  if (result.skipped) {
    console.log(`⏭️  ${result.message}`)
    console.log('   To re-seed, delete existing listings first.\n')
    return
  }

  console.log(`✅ ${result.message}`)
  console.log(`   Generated: ${result.generated} listings`)
  console.log(`   Inserted: ${result.inserted} listings`)
  console.log('\n🎉 Seeding complete!\n')
}

// Run the seed function
runSeed()
  .then(() => {
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })

