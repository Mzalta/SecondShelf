'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Book, BookFormData } from '@/types'
import { useBookStore } from '@/lib/store/useBookStore'
import { categorizeBook } from '@/lib/api/categorize'
import FormInput from '@/components/features/forms/FormInput'
import Button from '@/components/ui/Button'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import AIEnhancer from '@/components/features/books/AIEnhancer'
import { Sparkles, X } from 'lucide-react'

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  course: z.string().min(1, 'Course is required'),
  price: z.string().min(1, 'Price is required'),
  contact: z.string().min(1, 'Contact information is required'),
  poster: z.string().min(1, 'Your name is required'),
  category: z.string().optional(),
  isbn: z.string().optional(),
  edition: z.string().optional(),
  condition_text: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

interface EditListingDialogProps {
  book: Book
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function EditListingDialog({
  book,
  isOpen,
  onClose,
  onSuccess
}: EditListingDialogProps) {
  const { updateListing, loading, error, clearError } = useBookStore()
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
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: book.title || '',
      author: book.author || '',
      course: book.course || '',
      price: book.price || '',
      contact: book.contact || '',
      poster: book.poster || '',
      category: book.category || ''
    }
  })
  
  // Watch title, author, and course for auto-categorization
  const title = watch('title')
  const author = watch('author')
  const course = watch('course')
  const category = watch('category')
  const price = watch('price')
  const isbn = watch('isbn')
  const edition = watch('edition')
  const conditionText = watch('condition_text')
  const description = watch('description')
  
  // Reset form when book changes
  useEffect(() => {
    if (isOpen && book) {
      reset({
        title: book.title || '',
        author: book.author || '',
        course: book.course || '',
        price: book.price?.replace(/^\$/, '') || '', // Remove $ for editing
        contact: book.contact || '',
        poster: book.poster || '',
        category: book.category || '',
        isbn: book.isbn || '',
        edition: book.edition || '',
        condition_text: book.condition_text || '',
        description: book.description || '',
        tags: book.tags || []
      })
      setCategorizeError(null)
    }
  }, [isOpen, book, reset])
  
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
    if (!isOpen || !title || !author || !course) return
    
    const timer = setTimeout(() => {
      // Only auto-categorize if category is empty
      if (!category) {
        handleCategorize()
      }
    }, 1500) // Wait 1.5 seconds after user stops typing
    
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, author, course, isOpen, category])
  
  // Format price with dollar sign
  const formatPrice = (value: string): string => {
    // Remove any existing dollar signs and trim
    const cleaned = value.replace(/\$/g, '').trim()
    
    if (!cleaned) return ''
    
    // Check if it's a valid number (possibly with decimals)
    const numericMatch = cleaned.match(/^(\d+\.?\d*)$/)
    
    if (numericMatch) {
      // It's a number, format with dollar sign
      return `$${cleaned}`
    }
    
    // If not a valid number, return empty string (shouldn't happen with restrictions)
    return ''
  }

  // Get register props for price field
  const priceRegister = register('price')

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point, numbers
    // Allow: Ctrl/Cmd + A, C, V, X (for copy/paste)
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key) ||
      (e.key === 'a' && (e.ctrlKey || e.metaKey)) ||
      (e.key === 'c' && (e.ctrlKey || e.metaKey)) ||
      (e.key === 'v' && (e.ctrlKey || e.metaKey)) ||
      (e.key === 'x' && (e.ctrlKey || e.metaKey)) ||
      (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') ||
      (e.key >= '0' && e.key <= '9') ||
      (e.key === '.' && !e.currentTarget.value.includes('.')) // Only allow one decimal point
    ) {
      return // Allow the key press
    }
    e.preventDefault() // Block all other keys
  }

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Filter out any non-numeric characters (except decimal point)
    const value = e.target.value
    // Remove everything except digits and decimal point
    const filtered = value.replace(/[^\d.]/g, '')
    
    // Ensure only one decimal point
    const parts = filtered.split('.')
    const sanitized = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : filtered
    
    // Update the input value
    e.target.value = sanitized
    setValue('price', sanitized, { shouldValidate: false })
    
    // Call the original onChange from react-hook-form
    priceRegister.onChange(e)
  }

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Format price with dollar sign when user leaves the field
    const inputValue = e.target.value
    if (inputValue.trim()) {
      const formatted = formatPrice(inputValue)
      if (formatted) {
        setValue('price', formatted, { shouldValidate: true })
        // Update the input's display value
        e.target.value = formatted
      }
    }
    
    // Call the original onBlur from react-hook-form
    priceRegister.onBlur(e)
  }

  const onSubmit = async (data: BookFormData) => {
    if (!book.id) {
      return
    }
    
    try {
      // Ensure price is formatted before submission
      const formattedData = {
        ...data,
        price: formatPrice(data.price)
      }
      await updateListing(book.id, formattedData)
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      // Error is already handled in the store
      console.error('Error updating book:', error)
    }
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Book Listing</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <ErrorDisplay
          error={error}
          onDismiss={() => clearError()}
        />
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          
          <FormInput
            label="ISBN"
            placeholder="e.g., 978-0-123456-78-9 (Optional)"
            error={errors.isbn?.message}
            {...register('isbn')}
          />
          
          <FormInput
            label="Edition"
            placeholder="e.g., 5th Edition, 2023 Edition (Optional)"
            error={errors.edition?.message}
            {...register('edition')}
          />
          
          <div className="mb-4">
            <label htmlFor="condition_text" className="block text-sm font-medium text-gray-700 mb-1">
              Condition Description <span className="text-gray-500 text-xs">(Optional but recommended)</span>
            </label>
            <textarea
              id="condition_text"
              rows={3}
              placeholder="e.g., light highlighting, cover bent, no tears, pages in good condition"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                errors.condition_text ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('condition_text')}
            />
            {errors.condition_text && (
              <p className="mt-1 text-sm text-red-600">{errors.condition_text.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Describe the physical condition of the book honestly. This helps buyers make informed decisions.
            </p>
          </div>
          
          {/* AI Enhancer */}
          <AIEnhancer
            isbn={isbn}
            edition={edition}
            conditionText={conditionText || ''}
            currentTitle={title}
            currentDescription={description}
            onApplyTitle={(title) => setValue('title', title)}
            onApplyDescription={(desc) => setValue('description', desc)}
            onApplyBullets={(bullets) => {
              // Store bullets in tags
              setValue('tags', bullets)
            }}
            onApplyKeywords={(keywords) => setValue('tags', keywords)}
            onApplyPriceRange={(min, max) => {
              const avgPrice = ((min + max) / 2).toFixed(2)
              setValue('price', avgPrice)
            }}
          />
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Full Description <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Add a detailed description of the book, its condition, and any additional information..."
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          
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
          
          <div className="mb-4">
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="price"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 50 (will format to $50)"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
              }`}
              {...priceRegister}
              onKeyDown={handlePriceKeyDown}
              onInput={handlePriceInput}
              onBlur={handlePriceBlur}
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
            )}
          </div>
          
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
              Update Listing
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

