'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBookStore } from '@/lib/store/useBookStore'
import FormInput from '@/components/features/forms/FormInput'
import Button from '@/components/ui/Button'
import { BookFormData } from '@/types'

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  course: z.string().min(1, 'Course is required'),
  price: z.string().min(1, 'Price is required'),
  contact: z.string().min(1, 'Contact information is required'),
  poster: z.string().min(1, 'Your name is required')
})

export default function AddBookPage() {
  const router = useRouter()
  const { addListing, setCurrentUser } = useBookStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema)
  })
  
  const onSubmit = async (data: BookFormData) => {
    setCurrentUser(data.poster)
    addListing({
      ...data,
      sold: false,
      createdAt: new Date().toISOString()
    })
    reset()
    router.push('/')
  }
  
  return (
    <section className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Add a New Book Listing</h2>
      
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
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Add Listing
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => reset()}
          >
            Clear Form
          </Button>
        </div>
      </form>
    </section>
  )
}
