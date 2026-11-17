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
  PhotoUploadRequest,
  PhotoUploadTicket,
} from '../types'
import { api, uploadToPresignedUrl, USE_MOCKS } from './api'

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
  if (!PHOTO_CONTENT_TYPES.includes(file.type)) return `${file.name}: use a JPEG, PNG, or WebP image.`
  if (file.size > PHOTO_MAX_BYTES) return `${file.name}: the image must be 5 MB or smaller.`
  return null
}

/**
 * Uploads a pet photo to S3 in three steps, so the file never passes through EC2:
 *
 * 1. `POST /pets/{id}/photos/upload-url` — the API returns a presigned PUT URL and the S3 key;
 * 2. `PUT <presigned URL>` — the browser sends the file directly to the S3 bucket;
 * 3. `POST /pets/{id}/photos` with `{ s3_key }` — the API stores the key in RDS.
 */
export async function uploadPetPhoto(petId: string, file: File, signal?: AbortSignal): Promise<PetPhoto> {
  if (USE_MOCKS) return addMockPetPhoto(petId, file, signal)

  const path = `/pets/${encodeURIComponent(petId)}/photos`
  const request: PhotoUploadRequest = { filename: file.name, content_type: file.type }
  const ticket = await api.post<PhotoUploadTicket>(`${path}/upload-url`, request, { signal })
  await uploadToPresignedUrl(ticket.upload_url, file, signal)
  return api.post<PetPhoto>(path, { s3_key: ticket.s3_key }, { signal })
}
