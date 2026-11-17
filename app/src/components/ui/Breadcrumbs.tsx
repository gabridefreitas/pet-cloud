import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'

export interface Crumb {
  label: string
  /** Omit for the current page (the last crumb). */
  to?: string
}

/** Purple strip under the navbar with the page's breadcrumb trail. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <div className="bg-brand-400">
      <nav
        aria-label="Breadcrumb"
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 px-4 py-2 text-xs text-white sm:px-6 lg:px-8"
      >
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <ChevronRight className="size-3" aria-hidden />}
            {item.to ? (
              <Link to={item.to} className="hover:underline">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="underline">
                {item.label}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
    </div>
  )
}
