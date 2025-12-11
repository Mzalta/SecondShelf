import { ReactNode } from 'react'
import clsx from 'clsx'

interface BookGridProps {
  children: ReactNode
  columns?: number
  className?: string
}

export default function BookGrid({ children, columns = 3, className }: BookGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  }
  
  return (
    <div
      className={clsx(
        'grid gap-6',
        gridCols[columns as keyof typeof gridCols] || gridCols[3],
        className
      )}
    >
      {children}
    </div>
  )
}
