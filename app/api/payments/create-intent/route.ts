import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getBookById } from '@/lib/api/books'

/**
 * POST /api/payments/create-intent
 * Creates a Stripe Payment Intent for purchasing a book
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe client lazily (only when route is called, not during build)
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key is not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
    })

    const supabase = createClient()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { bookId } = body

    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      )
    }

    // Get book details
    const book = await getBookById(bookId)
    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check if book is already sold
    if (book.sold) {
      return NextResponse.json(
        { error: 'This book has already been sold' },
        { status: 400 }
      )
    }

    // Check if user is trying to buy their own book
    if (book.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot purchase your own book' },
        { status: 400 }
      )
    }

    // Parse price (assuming format like "$50" or "50")
    const priceString = book.price.replace(/[^0-9.]/g, '')
    const priceInDollars = parseFloat(priceString)
    
    if (isNaN(priceInDollars) || priceInDollars <= 0) {
      return NextResponse.json(
        { error: 'Invalid book price' },
        { status: 400 }
      )
    }

    // Convert to cents
    const amountInCents = Math.round(priceInDollars * 100)

    // Create or retrieve Stripe customer
    let customerId: string | undefined
    
    // Check if user already has a customer ID stored
    const { data: existingPurchase } = await supabase
      .from('purchases')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single()

    if (existingPurchase?.stripe_customer_id) {
      customerId = existingPurchase.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        book_id: bookId,
        book_title: book.title,
        buyer_user_id: user.id,
        seller_user_id: book.userId || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create purchase record in database
    const { error: dbError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        book_id: bookId,
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: customerId,
        amount: amountInCents,
        currency: 'usd',
        status: 'pending',
      })

    if (dbError) {
      console.error('Error creating purchase record:', dbError)
      // Still return the payment intent, but log the error
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}

