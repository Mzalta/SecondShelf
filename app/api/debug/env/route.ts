import { NextResponse } from 'next/server'

// Ensure this route runs on Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/debug/env
 * Diagnostic endpoint to check if environment variables are loaded
 * ⚠️ Remove or secure this endpoint in production!
 */
export async function GET() {
  // Check which environment variables are set (without exposing values)
  const envCheck = {
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'NOT SET',
    STRIPE_PRICE_ID: !!process.env.STRIPE_PRICE_ID,
    STRIPE_PRICE_ID_VALUE: process.env.STRIPE_PRICE_ID || 'NOT SET',
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    OPENAI_API_KEY_PREFIX: process.env.OPENAI_API_KEY?.substring(0, 7) || 'NOT SET',
    OPENAI_API_KEY_FORMAT_VALID: process.env.OPENAI_API_KEY?.startsWith('sk-') || false,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
  }

  return NextResponse.json({
    message: 'Environment variable check',
    environment: envCheck.VERCEL ? 'Vercel' : 'Local',
    vercelEnv: envCheck.VERCEL_ENV,
    variables: envCheck,
    timestamp: new Date().toISOString(),
  })
}

