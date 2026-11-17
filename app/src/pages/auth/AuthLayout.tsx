import type { ReactNode } from 'react'

/** Centered card shared by the login and register pages. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-brand-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

