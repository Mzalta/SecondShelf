'use client'

import { X } from 'lucide-react'

interface AboutDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">About SecondShelf</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4 leading-relaxed">
            <strong>SecondShelf</strong> is a streamlined, campus-focused platform designed to help college students buy, sell, and trade textbooks efficiently. Built with simplicity and convenience in mind, SecondShelf eliminates the hassles of fragmented online marketplaces, shipping delays, and inconvenient bookstore hours.
          </p>
          
          <p className="text-gray-700 mb-4 leading-relaxed">
            The platform addresses a critical need: students often struggle to find affordable textbooks at the start of each semester, while simultaneously having difficulty selling their books after courses end. SecondShelf creates a local-first marketplace that connects students on the same campus, enabling instant, convenient textbook exchanges without the complexity of shipping or coordinating across multiple platforms.
          </p>
          
          <p className="text-gray-700 mb-4 leading-relaxed">
            Key features include easy listing creation, powerful search and filtering capabilities, favorites functionality to save interesting books, and a straightforward process to mark listings as sold. All transactions happen locally, reducing costs and wait times while fostering a sense of community among students.
          </p>
          
          <p className="text-gray-700 leading-relaxed">
            SecondShelf transforms textbook exchanges from a time-consuming, multi-platform challenge into an effortless, one-stop solution that helps students get the books they need quickly and easily, right on their campus.
          </p>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

