/**
 * Standard loading, error, and empty states for API-backed screens
 * (required for every API request by the project conventions).
 */
import { LoaderCircle, RotateCcw, SearchX, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { primaryButtonClass } from './styles'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-16 text-sm text-gray-600">
      <LoaderCircle className="size-8 animate-spin text-brand-500" aria-hidden />
      {label}
    </div>
  )
}

export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-xl border border-gray-200 px-6 py-16 text-center">
      <p className="font-medium text-brand-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${primaryButtonClass} mt-5`}>
          <RotateCcw className="size-4" aria-hidden />
          Try again
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  /** Optional call to action, e.g. a link or button. */
  children?: ReactNode
}

export function EmptyState({ title, description, icon: Icon = SearchX, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 px-6 py-16 text-center">
      <Icon className="size-10 text-brand-300" aria-hidden />
      <p className="mt-3 font-medium text-brand-900">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}
