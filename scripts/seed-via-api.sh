#!/bin/bash

# Script to seed database via Vercel API endpoint
# Usage: ./scripts/seed-via-api.sh [vercel-url] [secret-key]

VERCEL_URL="${1:-https://second-shelf.vercel.app}"
SECRET_KEY="${2:-}"

echo "🌱 Database Seeding via Vercel API"
echo "=================================="
echo "URL: $VERCEL_URL"
echo ""

# Check status first
echo "📊 Checking endpoint status..."
STATUS_RESPONSE=$(curl -s "$VERCEL_URL/api/admin/seed-listings")
echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

# Prepare curl command
CURL_CMD="curl -X POST $VERCEL_URL/api/admin/seed-listings -H 'Content-Type: application/json'"

if [ -n "$SECRET_KEY" ]; then
  CURL_CMD="$CURL_CMD -H 'X-Seed-Secret: $SECRET_KEY'"
  echo "🔐 Using secret key protection"
else
  echo "⚠️  No secret key provided (endpoint will be unprotected if SEED_SECRET_KEY is not set)"
fi

echo ""
echo "🚀 Triggering database seed..."
echo ""

# Execute the seeding
RESPONSE=$(eval $CURL_CMD)

# Pretty print JSON response if possible
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Done!"

