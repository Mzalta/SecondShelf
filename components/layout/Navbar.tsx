'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export default function Navbar() {
  const pathname = usePathname()
  
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/add', label: 'Add Book' },
    { href: '/favorites', label: 'Favorites' },
    { href: '/subscription', label: 'Subscription' }
  ]
  
  return (
    <ul className="flex gap-4 sm:gap-8 list-none">
      {navLinks.map((link) => {
        const isActive = pathname === link.href
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={clsx(
                'text-white no-underline font-medium transition-opacity duration-200',
                'hover:opacity-80',
                isActive && 'underline underline-offset-4 decoration-2'
              )}
            >
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
