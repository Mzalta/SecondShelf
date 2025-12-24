'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export default function Navbar() {
  const pathname = usePathname()
  
  const navLinks = [
    { href: '/', label: 'All Books' },
    { href: '/my-shelf', label: 'My Shelf' },
    { href: '/favorites', label: 'Favorites' }
  ]
  
  return (
    <nav className="py-2">
      <ul className="flex gap-6 sm:gap-8 list-none">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={clsx(
                  'text-white no-underline text-sm font-medium transition-colors duration-200',
                  'hover:text-purple-300',
                  isActive && 'text-purple-300 border-b-2 border-purple-300 pb-1'
                )}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
