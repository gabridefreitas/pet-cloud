import { TriangleAlert } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '../utils/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches rendering errors so one broken screen does not blank the whole app,
 * and reports them through the CloudWatch-ready logger.
 *
 * A class component is required: React has no hook equivalent for
 * `componentDidCatch`.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('Render error', {
      action: 'render',
      error,
      data: { component_stack: info.componentStack ?? null },
    })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <TriangleAlert className="size-10 text-brand-500" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold text-brand-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page could not be displayed. Please reload and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Reload page
        </button>
      </div>
    )
  }
}
