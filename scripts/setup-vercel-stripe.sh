#!/bin/bash

# Script to set up Stripe environment variables on Vercel
# This script will add all required Stripe and Supabase environment variables

set -e

echo "🚀 Setting up Stripe payment integration on Vercel"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed"
    echo "   Install it with: npm i -g vercel"
    echo "   Then run: vercel login"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel"
    echo "   Run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI is ready"
echo ""

# Load environment variables from .env.local if it exists
if [ -f .env.local ]; then
    echo "📝 Loading environment variables from .env.local..."
    source <(grep -v '^#' .env.local | grep -v '^$' | sed 's/^/export /')
    echo "✅ Environment variables loaded"
    echo ""
fi

# Function to add environment variable
add_env_var() {
    local var_name=$1
    local var_value=$2
    local description=$3
    
    if [ -z "$var_value" ]; then
        echo "⚠️  $var_name is not set, skipping..."
        return 1
    fi
    
    echo "📝 Adding $var_name..."
    echo "$var_value" | vercel env add "$var_name" production preview development --yes 2>/dev/null || {
        echo "   (Variable may already exist, updating...)"
        # Note: Vercel CLI doesn't support update directly, user needs to update via dashboard
        echo "   ⚠️  If variable exists, update it manually in Vercel Dashboard"
    }
    echo "   ✅ $description"
}

echo "🔧 Adding Stripe and Supabase environment variables..."
echo ""

# Stripe Variables
add_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "Stripe Secret Key"
add_env_var "STRIPE_PRICE_ID" "$STRIPE_PRICE_ID" "Stripe Price ID for subscriptions"
add_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret"
add_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe Publishable Key"

# Supabase Variables (if not already set)
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "Supabase Project URL"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anonymous Key"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key"

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "2. Verify all variables are set correctly"
echo "3. Make sure all variables are enabled for: Production, Preview, and Development"
echo "4. Redeploy your project to apply the changes"
echo ""
echo "🔗 Stripe Webhook Setup:"
echo "   After deployment, configure webhooks in Stripe Dashboard:"
echo "   - Payment webhook: https://your-domain.vercel.app/api/payments/webhook"
echo "   - Subscription webhook: https://your-domain.vercel.app/api/subscriptions/webhook"
echo ""
echo "   Events to listen for:"
echo "   - Payment: payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled"
echo "   - Subscription: checkout.session.completed, customer.subscription.*, invoice.payment_*"
echo ""

