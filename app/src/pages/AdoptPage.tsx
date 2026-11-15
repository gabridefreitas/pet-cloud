import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Pagination } from '../components/pets/Pagination'
import { PetCard } from '../components/pets/PetCard'
import { PetFiltersPanel } from '../components/pets/PetFiltersPanel'
import { Breadcrumbs } from '../components/ui/Breadcrumbs'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { usePets } from '../hooks/usePets'
import { DEFAULT_PAGE_SIZE } from '../services/pets'
import type { PetFilters } from '../types'

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200" aria-hidden>
      <div className="aspect-[16/9] animate-pulse bg-brand-50" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-1/3 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="h-16 animate-pulse rounded bg-gray-100" />
        <div className="h-9 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  )
}

export function AdoptPage() {
  // `draft` follows the sidebar; `applied` drives the request (on "Apply").
  const [draft, setDraft] = useState<PetFilters>({})
  const [applied, setApplied] = useState<PetFilters>({ page: 1 })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data, loading, error, reload } = usePets(applied)

  const totalPages = data ? Math.ceil(data.total / (data.page_size || DEFAULT_PAGE_SIZE)) : 0

  function applyFilters() {
    setApplied({ ...draft, page: 1 })
    setFiltersOpen(false)
  }

  function resetFilters() {
    setDraft({})
    setApplied({ page: 1 })
  }

  function changePage(page: number) {
    setApplied((current) => ({ ...current, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Adopt a pet' }]} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="sr-only">Adopt a pet</h1>

        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="pet-filters"
          className="mb-6 flex items-center gap-2 rounded-md border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 lg:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {filtersOpen ? 'Hide filters' : 'Show filters'}
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside id="pet-filters" className={`${filtersOpen ? 'block' : 'hidden'} min-w-0 lg:block`}>
            <PetFiltersPanel value={draft} onChange={setDraft} onApply={applyFilters} onReset={resetFilters} />
          </aside>

          <section aria-label="Pets available for adoption" aria-busy={loading} className="min-w-0">
            {error ? (
              <ErrorState title="We couldn't load the pets." message={error} onRetry={reload} />
            ) : loading && !data ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : data && data.items.length === 0 ? (
              <EmptyState title="No pets match these filters." description="Try removing some filters to see more pets.">
                <button type="button" onClick={resetFilters} className="text-sm font-medium text-brand-600 hover:underline">
                  Reset filters
                </button>
              </EmptyState>
            ) : (
              data && (
                <>
                  <p className="mb-4 text-sm text-gray-600">
                    {data.total} {data.total === 1 ? 'pet' : 'pets'} found
                  </p>
                  <div
                    className={`grid gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-50' : ''}`}
                  >
                    {data.items.map((pet) => (
                      <PetCard key={pet.id} pet={pet} />
                    ))}
                  </div>
                  <Pagination page={data.page} totalPages={totalPages} onChange={changePage} />
                </>
              )
            )}
          </section>
        </div>
      </div>
    </>
  )
}
