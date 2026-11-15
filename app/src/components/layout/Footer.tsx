import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiStatus } from './ApiStatus'

const CURRENT_YEAR = new Date().getFullYear()

const HELP_LINKS = [
  { to: '/adopt', label: 'Adopt a pet' },
  { to: '/rehome', label: 'Rehome a pet' },
  { to: '/about', label: 'About PetCloud' },
]

export function Footer() {
  return (
    <footer className="mt-24">
      <div className="bg-gray-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:px-8">
          <section>
            <h2 className="text-lg font-medium text-brand-900">How Can We Help?</h2>
            <ul className="mt-4 space-y-2">
              {HELP_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-brand-600 hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-brand-900">Contact Us</h2>
            <ul className="mt-4 space-y-3 text-sm text-brand-600">
              <li className="flex items-center gap-3">
                <MapPin className="size-4 shrink-0 text-brand-900" aria-hidden />
                São Leopoldo, RS, Brazil
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-brand-900" aria-hidden />
                +55 (51) 0000-0000
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-brand-900" aria-hidden />
                support@petcloud.example
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="bg-brand-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-white sm:px-6 lg:px-8">
          <p>©{CURRENT_YEAR} PetCloud</p>
          <ApiStatus />
        </div>
      </div>
    </footer>
  )
}
