#!/bin/bash

# Script to add Supabase environment variables to Vercel
# Usage: ./scripts/add-vercel-env.sh YOUR_VERCEL_TOKEN

set -e

VERCEL_TOKEN=${1:-$VERCEL_TOKEN}

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ Error: Vercel token is required"
  echo "Usage: ./scripts/add-vercel-env.sh YOUR_VERCEL_TOKEN"
  echo "   OR: export VERCEL_TOKEN=your_token && ./scripts/add-vercel-env.sh"
  exit 1
fi

echo "🔧 Adding Supabase environment variables to Vercel..."

# Add NEXT_PUBLIC_SUPABASE_URL
echo ""
echo "📝 Adding NEXT_PUBLIC_SUPABASE_URL..."
echo "https://wtwaoadrqzfewlcyutba.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development --token "$VERCEL_TOKEN" --yes

# Add NEXT_PUBLIC_SUPABASE_ANON_KEY
echo ""
echo "📝 Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d2FvYWRycXpmZXdsY3l1dGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Mzk1ODYsImV4cCI6MjA4MTQxNTU4Nn0.C5ggqMzSNN0AT4stp8Ts0W-5GsOk1MS5qqYXMzsfLL0" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development --token "$VERCEL_TOKEN" --yes

echo ""
echo "✅ Environment variables added successfully!"
echo ""
echo "🔄 Next steps:"
echo "   1. Go to Vercel Dashboard → Deployments"
echo "   2. Click the three dots (⋯) on your latest deployment"
echo "   3. Click 'Redeploy' (uncheck 'Use existing Build Cache')"
echo "   4. Wait for deployment to complete"
echo "   5. Test your sign-in button!"
