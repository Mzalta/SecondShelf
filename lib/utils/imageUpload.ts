import { createClient } from '@/lib/supabase/client'

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user ID to organize files by user
 * @returns The public URL of the uploaded image
 */
export async function uploadBookImage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = createClient()

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image')
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB')
  }

  // Generate a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('book-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading image:', error)
    throw new Error(`Failed to upload image: ${error.message}`)
  }

  // Get the public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('book-images').getPublicUrl(data.path)

  return publicUrl
}

