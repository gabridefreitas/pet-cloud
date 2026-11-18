import { MapPin, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Pet } from '../../types'
import { formatAge, isNewPet, primaryPhotoUrl, SEX_LABELS, SIZE_LABELS } from '../../utils/pets'
import { PetImage } from './PetImage'

function Attribute({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <dt className="text-sm font-medium text-gray-800">{label}:</dt>
      <dd className="truncate rounded bg-brand-50 px-1.5 py-0.5 text-[11px] text-brand-700" title={value}>
        {value}
      </dd>
    </div>
  )
}

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative">
        <PetImage src={primaryPhotoUrl(pet)} alt={`Photo of ${pet.name}`} className="aspect-[16/9]" />
        {isNewPet(pet) && (
          <span className="absolute top-0 left-5 flex flex-col items-center rounded-b-md bg-brand-600 px-2 pt-1 pb-1.5 text-[10px] font-medium text-white shadow">
            New
            <Star className="size-3.5 fill-white" aria-hidden />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-brand-900">{pet.name}</h3>

        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand-900">
          <MapPin className="size-3.5 text-brand-600" aria-hidden />
          {pet.state}, {pet.country}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
          <Attribute label="Gender" value={SEX_LABELS[pet.sex]} />
          <Attribute label="Breed" value={pet.breed} />
          <Attribute label="Age" value={formatAge(pet.age_months)} />
          <Attribute label="Size" value={SIZE_LABELS[pet.size]} />
        </dl>

        <p className="mt-4 line-clamp-2 text-sm text-gray-700">{pet.description}</p>

        <div className="mt-auto pt-4">
          <Link
            to={`/pets/${pet.id}`}
            className="block rounded-md border border-brand-600 py-2 text-center text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            More Info
          </Link>
        </div>
      </div>
    </article>
  )
}
