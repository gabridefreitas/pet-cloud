import { useEffect, useState } from 'react'
import { listPets } from '../services/pets'
import type { Paginated, Pet, PetFilters } from '../types'

interface PetsResult {
  /** The request this result answers, used to tell whether it is current. */
  filters: PetFilters
  attempt: number
  data: Paginated<Pet> | null
  error: string | null
}

/**
 * Loads the pet catalog for the given filters. Pass a stable `filters` object
 * (e.g. from `useState`); a new object triggers a new request. While a new
 * request runs, the previous page stays in `data` so the grid does not flash.
 */
export function usePets(filters: PetFilters) {
  const [result, setResult] = useState<PetsResult | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    listPets(filters, controller.signal)
      .then((data) => setResult({ filters, attempt, data, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Something went wrong.'
        setResult({ filters, attempt, data: null, error: message })
      })

    return () => controller.abort()
  }, [filters, attempt])

  const loading = result?.filters !== filters || result.attempt !== attempt

  return {
    data: result?.data ?? null,
    loading,
    error: loading ? null : (result?.error ?? null),
    retry: () => setAttempt((value) => value + 1),
  }
}
