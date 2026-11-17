import { PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="PetCloud home">
      <span className="grid size-10 place-items-center rounded-full bg-brand-900 text-white">
        <PawPrint className="size-5" aria-hidden />
      </span>
      <span className="text-lg leading-none font-bold text-brand-900">
        Pet
        <br />
        Cloud
      </span>
    </Link>
  )
}
