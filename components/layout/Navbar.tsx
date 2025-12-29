'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { MessageSquare } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/auth'

export default function Navbar() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    async function loadUnreadCount() {
      const user = await getCurrentUser()
      setCurrentUser(user)

      if (!user) {
        return
      }

      try {
        const response = await fetch('/api/messages/unread-count', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.unread_count || 0)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    loadUnreadCount()

    // Poll for unread count updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000)

    return () => clearInterval(interval)
  }, [])
  
  const navLinks = [
    { href: '/', label: 'All Books' },
    { href: '/my-shelf', label: 'My Shelf' },
    { href: '/favorites', label: 'Favorites' },
    { href: '/messages', label: 'Messages', showBadge: true }
  ]
  
  return (
    <nav className="py-2">
      <ul className="flex gap-6 sm:gap-8 list-none">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href === '/messages' && pathname?.startsWith('/messages'))
          const showBadge = link.showBadge && currentUser && unreadCount > 0
          
          return (
            <li key={link.href} className="relative">
              <Link
                href={link.href}
                className={clsx(
                  'text-white no-underline text-sm font-medium transition-colors duration-200 flex items-center gap-2',
                  'hover:text-purple-300',
                  isActive && 'text-purple-300 border-b-2 border-purple-300 pb-1'
                )}
              >
                {link.href === '/messages' && <MessageSquare size={16} />}
                {link.label}
                {showBadge && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
