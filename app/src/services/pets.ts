import { listMockPets } from '../mocks/pets'
import type { Paginated, Pet, PetFilters } from '../types'
import { api } from './api'

/**
 * Data comes from `src/mocks` unless `VITE_USE_MOCKS=false`. Mocks stay on by
 * default until the API implements the pet endpoints.
 */
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

export const DEFAULT_PAGE_SIZE = 9

/** `GET /pets` — public catalog with filters and pagination. */
export function listPets(filters: PetFilters, signal?: AbortSignal): Promise<Paginated<Pet>> {
  const query: PetFilters = { page: 1, page_size: DEFAULT_PAGE_SIZE, ...filters }
  if (USE_MOCKS) return listMockPets(query, signal)
  return api.get<Paginated<Pet>>('/pets', { query, signal })
}
