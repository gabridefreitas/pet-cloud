import { listPets } from '../services/pets'
import type { PetFilters } from '../types'
import { useAsyncData } from './useAsyncData'

/** Loads one page of the public pet catalog for the given filters. */
export function usePets(filters: PetFilters) {
  return useAsyncData(JSON.stringify(filters), (signal) => listPets(filters, signal))
}
