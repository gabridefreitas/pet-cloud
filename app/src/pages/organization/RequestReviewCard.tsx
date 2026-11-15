import { Baby, Home, Mail, MapPin, PawPrint, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PetImage } from '../../components/pets/PetImage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { inputClass } from '../../components/ui/styles'
import { decideAdoptionRequest } from '../../services/adoptionRequests'
import type { AdoptionRequestDecision, AdoptionRequestDetails } from '../../types'
import { formatDate, HOUSING_LABELS, primaryPhotoUrl } from '../../utils/pets'

interface RequestReviewCardProps {
  request: AdoptionRequestDetails
  /** Called after a successful decision so the list can reload. */
  onDecided: () => void
}

/**
 * One adoption request in the organization inbox: the adopter's profile and
 * answers, plus one-click approve/reject with an optional note for pending requests.
 */
export function RequestReviewCard({ request, onDecided }: RequestReviewCardProps) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<AdoptionRequestDecision['status'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { adopter, pet } = request
  const isPending = request.status === 'pending'

  async function decide(status: AdoptionRequestDecision['status']) {
    setBusy(status)
    setError(null)
    try {
      await decideAdoptionRequest(request.id, { status, review_note: note.trim() || undefined })
      onDecided()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the decision. Please try again.')
      setBusy(null)
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link to={`/pets/${pet.id}`} className="shrink-0">
          <PetImage src={primaryPhotoUrl(pet)} alt={`Photo of ${pet.name}`} className="aspect-[16/9] w-full rounded-lg sm:size-24 sm:aspect-auto" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-brand-900">
              {adopter.full_name} <span className="font-normal text-gray-500">wants to adopt</span>{' '}
              <Link to={`/pets/${pet.id}`} className="hover:underline">
                {pet.name}
              </Link>
            </h3>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Received on {formatDate(request.created_at)}</p>

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-700">
            <li className="flex items-center gap-1.5">
              <Mail className="size-4 text-brand-600" aria-hidden />
              <a href={`mailto:${adopter.email}`} className="hover:underline">
                {adopter.email}
              </a>
            </li>
            {adopter.phone && (
              <li className="flex items-center gap-1.5">
                <Phone className="size-4 text-brand-600" aria-hidden />
                {adopter.phone}
              </li>
            )}
            {adopter.city && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4 text-brand-600" aria-hidden />
                {adopter.city}
                {adopter.state && `, ${adopter.state}`}
              </li>
            )}
          </ul>

          <ul className="mt-3 flex flex-wrap gap-2 text-xs">
            <li className="flex items-center gap-1 rounded bg-brand-50 px-2 py-1 text-brand-800">
              <Home className="size-3.5" aria-hidden />
              {HOUSING_LABELS[request.housing_type]}
            </li>
            <li className="flex items-center gap-1 rounded bg-brand-50 px-2 py-1 text-brand-800">
              <Baby className="size-3.5" aria-hidden />
              {request.has_children ? 'Has children' : 'No children'}
            </li>
            <li className="flex items-center gap-1 rounded bg-brand-50 px-2 py-1 text-brand-800">
              <PawPrint className="size-3.5" aria-hidden />
              {request.has_other_pets ? 'Has other pets' : 'No other pets'}
            </li>
          </ul>

          <blockquote className="mt-3 border-l-2 border-brand-200 pl-3 text-sm text-gray-700">{request.message}</blockquote>

          {request.review_note && (
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-medium">Your note:</span> {request.review_note}
            </p>
          )}
        </div>
      </div>

      {isPending && (
        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
          <label htmlFor={`note-${request.id}`} className="sr-only">
            Note to the adopter (optional)
          </label>
          <input
            id={`note-${request.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note to the adopter (optional)"
            className={`${inputClass} sm:flex-1`}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => decide('rejected')}
              className="flex-1 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 sm:flex-none"
            >
              {busy === 'rejected' ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => decide('approved')}
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
            >
              {busy === 'approved' ? 'Approving…' : 'Approve'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </article>
  )
}
