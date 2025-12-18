'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle } from '@/lib/auth/auth'
import { categorizeBook } from '@/lib/api/categorize'
import FormInput from '@/components/features/forms/FormInput'
import Button from '@/components/ui/Button'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { BookFormData } from '@/types'
import { Sparkles } from 'lucide-react'

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  course: z.string().min(1, 'Course is required'),
  price: z.string().min(1, 'Price is required'),
  contact: z.string().min(1, 'Contact information is required'),
  poster: z.string().min(1, 'Your name is required'),
  category: z.string().optional()
})

export default function AddBookPage() {
  const router = useRouter()
  const { addListing, loading, error, setCurrentUser, fetchBooks, clearError } = useBookStore()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [categorizeError, setCategorizeError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema)
  })
  
  // Watch title, author, and course for auto-categorization
  const title = watch('title')
  const author = watch('author')
  const course = watch('course')
  const category = watch('category')
  
  // Check authentication on mount
  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user)
      setIsAuthenticated(!!user)
      setCheckingAuth(false)
    })
  }, [setCurrentUser])
  
  const handleSignIn = async () => {
    await signInWithGoogle()
  }
  
  const handleCategorize = async () => {
    if (!title || !author || !course) {
      setCategorizeError('Please fill in title, author, and course first')
      return
    }
    
    setIsCategorizing(true)
    setCategorizeError(null)
    
    try {
      const suggestedCategory = await categorizeBook({
        title: title.trim(),
        author: author.trim(),
        course: course.trim(),
      })
      setValue('category', suggestedCategory)
    } catch (error: any) {
      setCategorizeError(error.message || 'Failed to categorize book')
      console.error('Error categorizing:', error)
    } finally {
      setIsCategorizing(false)
    }
  }
  
  // Auto-categorize when all three fields are filled (debounced)
  useEffect(() => {
    if (!title || !author || !course) return
    
    const timer = setTimeout(() => {
      // Only auto-categorize if category is empty
      if (!category) {
        handleCategorize()
      }
    }, 1500) // Wait 1.5 seconds after user stops typing
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, author, course])
  
  const onSubmit = async (data: BookFormData) => {
    try {
      await addListing(data)
      await fetchBooks() // Refresh the list
      reset()
      router.push('/')
    } catch (error) {
      // Error is already handled in the store
      console.error('Error adding book:', error)
    }
  }
  
  if (checkingAuth) {
    return (
      <section className="max-w-2xl mx-auto">
        <div className="text-center py-8">Checking authentication...</div>
      </section>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <section className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Add a New Book Listing</h2>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="mb-4 text-gray-700">
            You need to sign in to add a book listing.
          </p>
          <Button
            variant="primary"
            onClick={handleSignIn}
          >
            Sign in with Google
          </Button>
        </div>
      </section>
    )
  }
  
  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Add a New Book Listing</h2>
      
      <ErrorDisplay
        error={error}
        onDismiss={() => clearError()}
      />
      
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
        <FormInput
          label="Book Title"
          placeholder="e.g., Introduction to Computer Science"
          required
          error={errors.title?.message}
          {...register('title')}
        />
        
        <FormInput
          label="Author"
          placeholder="e.g., John Smith"
          required
          error={errors.author?.message}
          {...register('author')}
        />
        
        <FormInput
          label="Course"
          placeholder="e.g., CS 101, ENG 201"
          required
          error={errors.course?.message}
          {...register('course')}
        />
        
        {/* Category Field with Auto-Categorization */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-gray-500 text-xs">(Auto-filled)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="category"
              {...register('category')}
              placeholder="Category will be auto-suggested..."
              readOnly
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleCategorize}
              disabled={isCategorizing || !title || !author || !course}
              className="flex items-center gap-2"
            >
              <Sparkles size={16} />
              {isCategorizing ? 'Categorizing...' : 'Categorize'}
            </Button>
          </div>
          {categorizeError && (
            <p className="mt-1 text-sm text-red-600">{categorizeError}</p>
          )}
          {category && (
            <p className="mt-1 text-sm text-green-600">
              ✓ Category: {category}
            </p>
          )}
        </div>
        
        <FormInput
          label="Price"
          placeholder="e.g., $50 or Trade"
          required
          error={errors.price?.message}
          {...register('price')}
        />
        
        <FormInput
          label="Contact Information"
          placeholder="e.g., email@school.edu or @username"
          required
          error={errors.contact?.message}
          {...register('contact')}
        />
        
        <FormInput
          label="Your Name"
          placeholder="e.g., John Doe"
          required
          error={errors.poster?.message}
          {...register('poster')}
        />
        
        <div className="flex gap-4 mt-6">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            Add Listing
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset()}
            disabled={isSubmitting || loading}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </section>
  )
}
