#!/bin/bash

# Setup script for Supabase and Vercel CLIs
# This script helps set up and use both CLIs

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUPABASE_BIN="$PROJECT_DIR/.bin/supabase"

echo "🚀 Setting up Supabase and Vercel CLIs\n"

# Check if Supabase CLI is installed
if [ -f "$SUPABASE_BIN" ]; then
    echo "✅ Supabase CLI found at: $SUPABASE_BIN"
    export PATH="$PATH:$PROJECT_DIR/.bin"
else
    echo "❌ Supabase CLI not found"
    exit 1
fi

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI found"
    vercel --version
else
    echo "❌ Vercel CLI not found"
    exit 1
fi

echo "\n📋 Next Steps:\n"

echo "1. For Supabase Migration:"
echo "   Option A: Run via Supabase Dashboard (Easiest)"
echo "   - Go to: https://supabase.com/dashboard"
echo "   - Select your project"
echo "   - SQL Editor → New query"
echo "   - Copy: supabase/migrations/006_add_category_to_books.sql"
echo "   - Paste and Run\n"

echo "   Option B: Use Supabase CLI (Requires login)"
echo "   - Run: $SUPABASE_BIN login"
echo "   - Then: $SUPABASE_BIN db push\n"

echo "2. For Vercel Environment Variables:"
echo "   - Run: vercel env add OPENAI_API_KEY"
echo "   - Or use the dashboard: https://vercel.com/dashboard\n"

echo "✅ Setup complete!\n"
