#!/bin/bash

# Script to add all environment variables to Vercel
# Make sure you're logged in: vercel login

echo "🚀 Adding environment variables to Vercel..."
echo ""

# Supabase Variables
echo "📝 Adding Supabase variables..."
echo "https://wtwaoadrqzfewlcyutba.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development --yes
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzk1ODYsImV4cCI6MjA4MTQxNTU4Nn0.C5ggqMzSNN0AT4stp8Ts0W-5GsOk1MS5qqYXMzsfLL0" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development --yes

# ⚠️ SECURITY: SUPABASE_SERVICE_ROLE_KEY should NEVER be hardcoded in scripts
# Add it manually via Vercel Dashboard or use a secure method that reads from environment
echo "⚠️  SECURITY WARNING: SUPABASE_SERVICE_ROLE_KEY must be added manually via Vercel Dashboard"
echo "   Never commit service role keys to version control!"
echo ""
echo "To add SUPABASE_SERVICE_ROLE_KEY:"
echo "  1. Go to Vercel Dashboard → Settings → Environment Variables"
echo "  2. Get the key from Supabase Dashboard → Settings → API → service_role secret"
echo "  3. Add it manually in Vercel (do NOT use this script)"
echo ""

# Stripe Variables
echo "📝 Adding Stripe variables..."
echo "⚠️  WARNING: This script contains placeholder values."
echo "   Please update with your actual keys from .env.local or Stripe Dashboard"
echo ""
echo "To add Stripe variables, run:"
echo "  echo \"YOUR_STRIPE_SECRET_KEY\" | vercel env add STRIPE_SECRET_KEY production preview development"
echo "  echo \"YOUR_STRIPE_PUBLISHABLE_KEY\" | vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production preview development"
echo "  echo \"YOUR_STRIPE_WEBHOOK_SECRET\" | vercel env add STRIPE_WEBHOOK_SECRET production preview development"
echo "  echo \"YOUR_STRIPE_PRICE_ID\" | vercel env add STRIPE_PRICE_ID production preview development"
echo ""
echo "Or use the setup-vercel-stripe.sh script which reads from .env.local"

# OpenAI Variable
echo "📝 Adding OpenAI variable..."
echo "⚠️  WARNING: This script contains placeholder values."
echo "   Please update with your actual OpenAI API key"
echo ""
echo "To add OpenAI variable, run:"
echo "  echo \"YOUR_OPENAI_API_KEY\" | vercel env add OPENAI_API_KEY production preview development"

echo ""
echo "✅ All environment variables added!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel Dashboard and verify all variables are set"
echo "2. Redeploy your project to apply the changes"

