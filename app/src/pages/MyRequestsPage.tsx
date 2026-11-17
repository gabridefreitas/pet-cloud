import { Inbox } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PetImage } from '../components/pets/PetImage'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/Feedback'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAsyncData } from '../hooks/useAsyncData'
import { listMyAdoptionRequests } from '../services/adoptionRequests'
import type { AdoptionRequestStatus } from '../types'
import { formatDate, primaryPhotoUrl } from '../utils/pets'

/** Explains each status to the adopter, so the review is never opaque. */
const STATUS_HELP: Record<AdoptionRequestStatus, string> = {
  pending: 'The organization is reviewing your request.',
  approved: 'Approved! The organization will contact you to arrange the handover.',
  rejected: 'The organization did not approve this request.',
  cancelled: 'This request was cancelled.',
}

/** Adopter area: every adoption request they sent and its current status. */
export function MyRequestsPage() {
  const { data: requests, loading, error, reload } = useAsyncData('my-requests', listMyAdoptionRequests)

  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My adoption requests' }]} />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-brand-900">My adoption requests</h1>

        <div className="mt-6">
          {error ? (
            <ErrorState title="We couldn't load your requests." message={error} onRetry={reload} />
          ) : loading || !requests ? (
            <LoadingState label="Loading requests…" />
          ) : requests.length === 0 ? (
            <EmptyState icon={Inbox} title="You haven't sent any requests yet." description="Find a pet you love and ask to adopt.">
              <Link to="/adopt" className="text-sm font-medium text-brand-600 hover:underline">
                Browse pets
              </Link>
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {requests.map((request) => (
                <li key={request.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row">
                  <PetImage
                    src={primaryPhotoUrl(request.pet)}
                    alt={`Photo of ${request.pet.name}`}
                    className="aspect-[16/9] w-full shrink-0 rounded-lg sm:aspect-square sm:w-28"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/pets/${request.pet.id}`} className="text-lg font-semibold text-brand-900 hover:underline">
                        {request.pet.name}
                      </Link>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Sent on {formatDate(request.created_at)}</p>
                    <p className="mt-2 text-sm text-gray-700">{STATUS_HELP[request.status]}</p>
                    {request.review_note && (
                      <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <span className="font-medium">Note from the organization:</span> {request.review_note}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
