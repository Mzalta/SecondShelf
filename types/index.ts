// Type definitions for SecondShelf

export interface Book {
  id?: string
  title: string
  author: string
  course: string
  price: string
  contact: string
  poster?: string
  sold?: boolean
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
}

export interface Filters {
  query?: string
  course?: string
  priceMin?: number
  priceMax?: number
  condition?: string
}
