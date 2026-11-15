import { CircleUser, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from './Logo'

const NAV_LINKS = [
  { to: '/adopt', label: 'Adopt' },
  { to: '/rehome', label: 'Rehome' },
  { to: '/about', label: 'About Us' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium transition-colors hover:text-brand-600 ${isActive ? 'text-brand-600' : 'text-brand-900'}`
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-12 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/login"
          className="hidden items-center gap-2 rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 md:flex"
        >
          <CircleUser className="size-4" aria-hidden />
          Login | Register
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-brand-900 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {menuOpen && (
        <nav aria-label="Mobile" className="flex flex-col gap-4 border-t border-gray-100 px-4 py-4 md:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass} onClick={() => setMenuOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <Link to="/login" className="text-sm font-medium text-brand-600" onClick={() => setMenuOpen(false)}>
            Login | Register
          </Link>
        </nav>
      )}
    </header>
  )
}
