import { Inbox, PawPrint, Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/Feedback'
import { primaryButtonClass } from '../../components/ui/styles'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAuth } from '../../hooks/useAuth'
import { listOrganizationAdoptionRequests } from '../../services/adoptionRequests'
import { listOrganizationPets } from '../../services/pets'
import type { AdoptionRequestStatus } from '../../types'
import { OrganizationPetRow } from './OrganizationPetRow'
import { RequestReviewCard } from './RequestReviewCard'

type Tab = 'requests' | 'pets'
type RequestFilter = AdoptionRequestStatus | 'all'

const REQUEST_FILTERS: { value: RequestFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

/** Inbox of adoption requests received by the organization. */
function RequestsTab({ filter, onFilterChange }: { filter: RequestFilter; onFilterChange: (filter: RequestFilter) => void }) {
  const { data: requests, loading, error, reload } = useAsyncData('organization-requests', listOrganizationAdoptionRequests)
  const visible = requests?.filter((request) => filter === 'all' || request.status === filter) ?? []
  const pendingCount = requests?.filter((request) => request.status === 'pending').length ?? 0

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter requests by status">
        {REQUEST_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => onFilterChange(option.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              filter === option.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
            {option.value === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState title="We couldn't load the requests." message={error} onRetry={reload} />
        ) : loading && !requests ? (
          <LoadingState label="Loading requests…" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={filter === 'pending' ? 'No requests waiting for review.' : 'No requests here yet.'}
            description="New adoption requests for your pets will appear here."
          />
        ) : (
          <ul className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {visible.map((request) => (
              <li key={request.id}>
                <RequestReviewCard request={request} onDecided={reload} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/** Every pet of the organization, with availability controls. */
function PetsTab() {
  const { data: pets, loading, error, reload } = useAsyncData('organization-pets', listOrganizationPets)

  return (
    <div>
      <div className="flex justify-end">
        <Link to="/organization/pets/new" className={primaryButtonClass}>
          <Plus className="size-4" aria-hidden />
          Add pet
        </Link>
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState title="We couldn't load your pets." message={error} onRetry={reload} />
        ) : loading || !pets ? (
          <LoadingState label="Loading pets…" />
        ) : pets.length === 0 ? (
          <EmptyState icon={PawPrint} title="No pets registered yet." description="Add your first pet to start receiving adoption requests." />
        ) : (
          <ul className="space-y-3">
            {pets.map((pet) => (
              <OrganizationPetRow key={pet.id} pet={pet} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Organization portal. The active tab and request filter live in the URL
 * (`?tab=pets`, `?status=all`) so they survive reloads and can be linked.
 */
export function DashboardPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('tab') === 'pets' ? 'pets' : 'requests'
  const filter: RequestFilter = REQUEST_FILTERS.find((option) => option.value === searchParams.get('status'))?.value ?? 'pending'

  const tabClass = (value: Tab) =>
    `border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
      tab === value ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-brand-600'
    }`

  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Organization portal' }]} />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-brand-900">Organization portal</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome, {user?.full_name}. Review requests and keep your pets up to date.</p>

        <div role="tablist" aria-label="Portal sections" className="mt-8 flex gap-6 border-b border-gray-200">
          <button type="button" role="tab" aria-selected={tab === 'requests'} className={tabClass('requests')} onClick={() => setSearchParams({})}>
            Adoption requests
          </button>
          <button type="button" role="tab" aria-selected={tab === 'pets'} className={tabClass('pets')} onClick={() => setSearchParams({ tab: 'pets' })}>
            Our pets
          </button>
        </div>

        <div role="tabpanel" className="mt-6">
          {tab === 'requests' ? (
            <RequestsTab filter={filter} onFilterChange={(status) => setSearchParams(status === 'pending' ? {} : { status })} />
          ) : (
            <PetsTab />
          )}
        </div>
      </div>
    </>
  )
}
