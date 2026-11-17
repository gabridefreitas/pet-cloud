import { PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <PawPrint className="size-10 text-brand-300" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold text-brand-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-600">This page does not exist or is not available yet.</p>
      <Link
        to="/adopt"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Browse pets
      </Link>
    </div>
  )
}
