import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PetImage } from '../../components/pets/PetImage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { updatePetStatus } from '../../services/pets'
import type { Pet, PetStatus } from '../../types'
import { formatAge, PET_STATUS_OPTIONS, primaryPhotoUrl } from '../../utils/pets'

/** One pet in the organization's list, with an inline availability selector. */
export function OrganizationPetRow({ pet: initialPet }: { pet: Pet }) {
  // Local copy so the new status shows immediately after saving, without reloading the list.
  const [pet, setPet] = useState(initialPet)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function changeStatus(status: PetStatus) {
    setSaving(true)
    setError(null)
    try {
      setPet(await updatePetStatus(pet.id, status))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update the status.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
      <PetImage src={primaryPhotoUrl(pet)} alt={`Photo of ${pet.name}`} className="aspect-[16/9] w-full shrink-0 rounded-lg sm:size-16 sm:aspect-auto" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/pets/${pet.id}`} className="font-semibold text-brand-900 hover:underline">
            {pet.name}
          </Link>
          <StatusBadge status={pet.status} />
        </div>
        <p className="mt-0.5 text-sm text-gray-600">
          {pet.species === 'dog' ? 'Dog' : 'Cat'} · {pet.breed} · {formatAge(pet.age_months)} · {pet.photos.length}{' '}
          {pet.photos.length === 1 ? 'photo' : 'photos'}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="sm:w-56">
        <label htmlFor={`status-${pet.id}`} className="sr-only">
          Availability of {pet.name}
        </label>
        <select
          id={`status-${pet.id}`}
          value={pet.status}
          disabled={saving}
          onChange={(event) => changeStatus(event.target.value as PetStatus)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none disabled:opacity-60"
        >
          {PET_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} — {option.description}
            </option>
          ))}
        </select>
      </div>
    </li>
  )
}
