/**
 * Pet endpoints. Each function documents the API route it calls; while
 * `USE_MOCKS` is on, the in-memory mock with the same behavior answers instead.
 */
import {
  addMockPetPhoto,
  createMockPet,
  getMockPet,
  listMockOrganizationPets,
  listMockPets,
  updateMockPetStatus,
} from '../mocks/pets'
import type {
  Paginated,
  Pet,
  PetDetails,
  PetFilters,
  PetInput,
  PetPhoto,
  PetStatus,
} from '../types'
import { api, USE_MOCKS } from './api'

export const DEFAULT_PAGE_SIZE = 9

/** Accepted photo formats and maximum size, checked before uploading to S3. */
export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024

/** `GET /pets` — public catalog (available pets, newest first) with filters and pagination. */
export function listPets(filters: PetFilters, signal?: AbortSignal): Promise<Paginated<Pet>> {
  const query: PetFilters = { page: 1, page_size: DEFAULT_PAGE_SIZE, ...filters }
  if (USE_MOCKS) return listMockPets(query, signal)
  return api.get<Paginated<Pet>>('/pets', { query, signal })
}

/** `GET /pets/{id}` — public pet details with its organization. */
export function getPet(id: string, signal?: AbortSignal): Promise<PetDetails> {
  if (USE_MOCKS) return getMockPet(id, signal)
  return api.get<PetDetails>(`/pets/${encodeURIComponent(id)}`, { signal })
}

/** `GET /organizations/me/pets` — all pets of the logged-in member's organization, any status. */
export function listOrganizationPets(signal?: AbortSignal): Promise<Pet[]> {
  if (USE_MOCKS) return listMockOrganizationPets(signal)
  return api.get<Pet[]>('/organizations/me/pets', { signal })
}

/** `POST /pets` — creates a pet for the logged-in member's organization. */
export function createPet(input: PetInput, signal?: AbortSignal): Promise<Pet> {
  if (USE_MOCKS) return createMockPet(input, signal)
  return api.post<Pet>('/pets', input, { signal })
}

/** `PATCH /pets/{id}` — changes the availability status of an organization's pet. */
export function updatePetStatus(id: string, status: PetStatus, signal?: AbortSignal): Promise<Pet> {
  if (USE_MOCKS) return updateMockPetStatus(id, status, signal)
  return api.patch<Pet>(`/pets/${encodeURIComponent(id)}`, { status }, { signal })
}

/** Returns an error message if the file cannot be uploaded, or null if it is valid. */
export function validatePhoto(file: File): string | null {
  if (file.size === 0) return `${file.name}: the photo must not be empty.`
  if (!PHOTO_CONTENT_TYPES.includes(file.type)) return `${file.name}: use a JPEG, PNG, or WebP image.`
  if (file.size > PHOTO_MAX_BYTES) return `${file.name}: the image must be 5 MB or smaller.`
  return null
}

/** Sends the file to the API, which validates it, uploads to S3 and registers the photo. */
export async function uploadPetPhoto(petId: string, file: File, signal?: AbortSignal): Promise<PetPhoto> {
  if (USE_MOCKS) return addMockPetPhoto(petId, file, signal)

  const body = new FormData()
  body.append('file', file)
  return api.post<PetPhoto>(`/pets/${encodeURIComponent(petId)}/photos`, body, {
    signal,
    timeoutMs: 60_000,
  })
}
