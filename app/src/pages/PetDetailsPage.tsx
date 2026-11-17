import { Building2, Check, Mail, MapPin, Phone, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdoptionRequestDialog } from '../components/pets/AdoptionRequestDialog'
import { PetImage } from '../components/pets/PetImage'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../components/ui/Feedback'
import { StatusBadge } from '../components/ui/StatusBadge'
import { outlineButtonClass, primaryButtonClass } from '../components/ui/styles'
import { useAsyncData } from '../hooks/useAsyncData'
import { useAuth } from '../hooks/useAuth'
import { getPet } from '../services/pets'
import type { PetDetails } from '../types'
import { COLOR_OPTIONS, formatAge, SEX_LABELS, SIZE_LABELS } from '../utils/pets'

/** Photo viewer: large selected photo plus thumbnails when there is more than one. */
function PhotoGallery({ pet }: { pet: PetDetails }) {
  const photos = [...pet.photos].sort((a, b) => a.position - b.position)
  const [selected, setSelected] = useState(0)
  const current = photos[selected] ?? null

  return (
    <div>
      <PetImage
        key={current?.id ?? 'empty'}
        src={current?.url ?? null}
        alt={`Photo of ${pet.name}`}
        className="aspect-[4/3] rounded-xl"
      />
      {photos.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === selected}
              className={`shrink-0 overflow-hidden rounded-lg ring-2 ${index === selected ? 'ring-brand-600' : 'ring-transparent'}`}
            >
              <PetImage src={photo.url} alt="" className="size-20" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function HealthItem({ ok, label }: { ok: boolean; label: string }) {
  const Icon = ok ? Check : X
  return (
    <li className="flex items-center gap-2 text-sm text-gray-800">
      <Icon className={`size-4 ${ok ? 'text-emerald-600' : 'text-gray-400'}`} aria-hidden />
      {label}
      <span className="sr-only">{ok ? 'yes' : 'no'}</span>
    </li>
  )
}

/** Call to action that depends on pet availability and who is viewing. */
function AdoptionAction({ pet, onRequest }: { pet: PetDetails; onRequest: () => void }) {
  const { user } = useAuth()

  if (pet.status !== 'available') {
    return (
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
        {pet.name} is not accepting new adoption requests right now.
      </p>
    )
  }
  if (!user) {
    return (
      <Link to={`/login?redirect=${encodeURIComponent(`/pets/${pet.id}`)}`} className={`${primaryButtonClass} w-full`}>
        Log in to request adoption
      </Link>
    )
  }
  if (user.role !== 'adopter') {
    return (
      <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
        Organization accounts cannot submit adoption requests.
      </p>
    )
  }
  return (
    <button type="button" onClick={onRequest} className={`${primaryButtonClass} w-full`}>
      Request adoption
    </button>
  )
}

export function PetDetailsPage() {
  const { id = '' } = useParams()
  const { data: pet, loading, error, reload } = useAsyncData(id, (signal) => getPet(id, signal))
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Adopt', to: '/adopt' }, { label: pet?.name ?? 'Pet' }]} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error ? (
          <ErrorState title="We couldn't load this pet." message={error} onRetry={reload} />
        ) : loading || !pet ? (
          <LoadingState label="Loading pet…" />
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <PhotoGallery pet={pet} />

            <div className="space-y-8">
              <header>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold text-brand-900">{pet.name}</h1>
                  {pet.status !== 'available' && <StatusBadge status={pet.status} />}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-900">
                  <MapPin className="size-4 text-brand-600" aria-hidden />
                  {pet.city}, {pet.state}, {pet.country}
                </p>
              </header>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['Species', pet.species === 'dog' ? 'Dog' : 'Cat'],
                  ['Breed', pet.breed],
                  ['Gender', SEX_LABELS[pet.sex]],
                  ['Age', formatAge(pet.age_months)],
                  ['Size', SIZE_LABELS[pet.size]],
                  ['Color', COLOR_OPTIONS.find((color) => color.value === pet.color)?.label ?? pet.color],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-brand-50 px-3 py-2">
                    <dt className="text-xs text-brand-700">{label}</dt>
                    <dd className="text-sm font-medium text-brand-900">{value}</dd>
                  </div>
                ))}
              </dl>

              <section>
                <h2 className="font-semibold text-brand-900">About {pet.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">{pet.description}</p>
              </section>

              <section>
                <h2 className="font-semibold text-brand-900">Health</h2>
                <ul className="mt-2 space-y-1.5">
                  <HealthItem ok={pet.is_vaccinated} label="Vaccinated" />
                  <HealthItem ok={pet.is_neutered} label="Neutered / spayed" />
                </ul>
                {pet.health_notes && <p className="mt-3 text-sm text-gray-700">{pet.health_notes}</p>}
              </section>

              <AdoptionAction pet={pet} onRequest={() => setDialogOpen(true)} />

              <section className="rounded-xl border border-gray-200 p-5">
                <h2 className="flex items-center gap-2 font-semibold text-brand-900">
                  <Building2 className="size-5 text-brand-600" aria-hidden />
                  {pet.organization.name}
                </h2>
                {pet.organization.description && (
                  <p className="mt-2 text-sm text-gray-700">{pet.organization.description}</p>
                )}
                <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <MapPin className="size-4 text-brand-600" aria-hidden />
                    {pet.organization.city}, {pet.organization.state}
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="size-4 text-brand-600" aria-hidden />
                    <a href={`mailto:${pet.organization.email}`} className="hover:underline">
                      {pet.organization.email}
                    </a>
                  </li>
                  {pet.organization.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="size-4 text-brand-600" aria-hidden />
                      {pet.organization.phone}
                    </li>
                  )}
                </ul>
              </section>

              <Link to="/adopt" className={outlineButtonClass}>
                Back to all pets
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mounted only while open, so each opening starts with a fresh form. */}
      {pet && dialogOpen && <AdoptionRequestDialog pet={pet} open onClose={() => setDialogOpen(false)} />}
    </>
  )
}
