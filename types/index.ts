// Type definitions for SecondShelf

export interface Book {
  id?: string
  userId?: string | null
  title: string
  author: string
  course: string
  price: string
  contact: string
  poster?: string
  sold?: boolean
  category?: string
  createdAt?: string
  updatedAt?: string
}

export interface BookFormData {
  title: string
  author: string
  course: string
  price: string
  contact: string
  poster: string
  category?: string
}

export interface Filters {
  query?: string
  course?: string
  priceMin?: number
  priceMax?: number
  condition?: string
}

export interface Purchase {
  id: string
  userId: string
  bookId: string
  stripePaymentIntentId: string
  stripeCustomerId: string
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  createdAt: string
  book?: Book
}

export interface Subscription {
  id: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}
