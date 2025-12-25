'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBookStore } from '@/lib/store/useBookStore'
import { getCurrentUser, signInWithGoogle } from '@/lib/auth/auth'
import { categorizeBook } from '@/lib/api/categorize'
import { uploadBookImage } from '@/lib/utils/imageUpload'
import FormInput from '@/components/features/forms/FormInput'
import Button from '@/components/ui/Button'
import ErrorDisplay from '@/components/ui/ErrorDisplay'
import { BookFormData } from '@/types'
import { Upload, X } from 'lucide-react'

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
  const { addListing, loading, error, setCurrentUser, fetchBooks, clearError, currentUser } = useBookStore()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isCategorizing, setIsCategorizing] = useState(false)
  const [categorizeError, setCategorizeError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
  
  // Watch title, author, and course for categorization
  const title = watch('title')
  const author = watch('author')
  const course = watch('course')
  const price = watch('price')
  
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
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
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
    try {
      setIsCategorizing(true)
      setCategorizeError(null)
      
      // Get current user for image upload (use store user or fetch it)
      const user = currentUser || await getCurrentUser()
      if (!user) {
        throw new Error('You must be signed in to add a listing')
      }
      
      let imageUrl: string | undefined = undefined
      
      // Upload image if one is selected
      if (selectedImage) {
        setUploadingImage(true)
        try {
          imageUrl = await uploadBookImage(selectedImage, user.id)
        } catch (error: any) {
          setUploadingImage(false)
          setIsCategorizing(false)
          alert(`Failed to upload image: ${error.message}`)
          return
        }
        setUploadingImage(false)
      }
      
      // Categorize the book
      let category: string | undefined = undefined
      if (title && author && course) {
        try {
          category = await categorizeBook({
            title: title.trim(),
            author: author.trim(),
            course: course.trim(),
          })
        } catch (error: any) {
          // Don't block submission if categorization fails
          console.error('Error categorizing book:', error)
          setCategorizeError(error.message || 'Failed to categorize book')
        }
      }
      
      setIsCategorizing(false)
      
      // Ensure price is formatted before submission
      const formattedData: BookFormData = {
        ...data,
        price: formatPrice(data.price),
        category,
        imageUrl
      }
      
      await addListing(formattedData)
      await fetchBooks() // Refresh the list
      reset()
      setSelectedImage(null)
      setImagePreview(null)
      router.push('/')
    } catch (error) {
      setIsCategorizing(false)
      setUploadingImage(false)
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
        
        {/* Image Upload Field */}
        <div className="mb-4">
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Book Image <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          {!imagePreview ? (
            <div className="mt-1">
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
                <input
                  id="image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          ) : (
            <div className="mt-1 relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-300">
                <img
                  src={imagePreview}
                  alt="Book preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
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
        
        {categorizeError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Note: Could not automatically categorize this book. You can still add the listing.
            </p>
          </div>
        )}
        
        <div className="flex gap-4 mt-6">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting || loading || isCategorizing || uploadingImage}
            disabled={isSubmitting || loading || isCategorizing || uploadingImage}
          >
            {isCategorizing ? 'Categorizing...' : uploadingImage ? 'Uploading image...' : 'Add Listing'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              reset()
              setSelectedImage(null)
              setImagePreview(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            disabled={isSubmitting || loading || isCategorizing || uploadingImage}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </section>
  )
}
