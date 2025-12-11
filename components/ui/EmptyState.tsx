import { ReactNode } from 'react'
import Link from 'next/link'
import Button from './Button'

interface EmptyStateProps {
  title?: string
  message: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
  icon?: ReactNode
}

export default function EmptyState({
  title,
  message,
  actionLabel,
  actionHref,
  actionOnClick,
  icon
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && <div className="mb-4 text-6xl">{icon}</div>}
      {title && <h3 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h3>}
      <p className="text-gray-600 mb-6">{message}</p>
      {actionLabel && (
        <>
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary">{actionLabel}</Button>
            </Link>
          ) : actionOnClick ? (
            <Button variant="primary" onClick={actionOnClick}>
              {actionLabel}
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}
