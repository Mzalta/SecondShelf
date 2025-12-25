#!/bin/bash

# Script to add all environment variables to Vercel
# Make sure you're logged in: vercel login

echo "🚀 Adding environment variables to Vercel..."
echo ""

# Supabase Variables
echo "📝 Adding Supabase variables..."
echo "https://wtwaoadrqzfewlcyutba.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development --yes
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzk1ODYsImV4cCI6MjA4MTQxNTU4Nn0.C5ggqMzSNN0AT4stp8Ts0W-5GsOk1MS5qqYXMzsfLL0" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development --yes
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgzOTU4NiwiZXhwIjoyMDgxNDE1NTg2fQ.l8FdY4_MOCLBExpUW6yjXN6L1T4g6U1XcvrRwZdkgtI" | vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development --yes

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

