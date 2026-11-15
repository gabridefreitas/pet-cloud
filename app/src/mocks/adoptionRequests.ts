/**
 * Mock adoption request endpoints. They enforce the same business rules the
 * API must implement (see the README's API contract):
 *
 * - only adopters can submit requests, and only for available pets;
 * - an adopter can have one open (pending) request per pet;
 * - only the pet's organization can approve or reject, and only pending requests;
 * - approving a request moves the pet to "pending" (handover in progress) and
 *   hides it from the public catalog.
 */
import { ApiError } from '../services/api'
import type {
  AdopterSummary,
  AdoptionRequest,
  AdoptionRequestDecision,
  AdoptionRequestDetails,
  AdoptionRequestInput,
} from '../types'
import { mockDelay, nowIso } from './delay'
import { findMockPet } from './pets'
import { mockUsers, requireMockUser } from './users'

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const mockAdoptionRequests: AdoptionRequest[] = [
  {
    id: 'request-1',
    pet_id: 'pet-pitter',
    adopter_id: 'user-marina',
    organization_id: 'org-happy-paws',
    status: 'pending',
    message:
      'I work from home and have a house with a fenced yard. I have always wanted a big, friendly dog like Pitter.',
    housing_type: 'house',
    has_children: false,
    has_other_pets: false,
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
  },
  {
    id: 'request-2',
    pet_id: 'pet-felix',
    adopter_id: 'user-jordan',
    organization_id: 'org-happy-paws',
    status: 'pending',
    message: 'Our family already has an older, calm cat and two kids who love animals. Felix would fit right in.',
    housing_type: 'apartment',
    has_children: true,
    has_other_pets: true,
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: daysAgo(3),
    updated_at: daysAgo(3),
  },
  {
    id: 'request-3',
    pet_id: 'pet-balto',
    adopter_id: 'user-jordan',
    organization_id: 'org-happy-paws',
    status: 'rejected',
    message: 'I live in a small apartment but can walk him twice a day.',
    housing_type: 'apartment',
    has_children: false,
    has_other_pets: false,
    review_note: 'Balto needs a house with a yard. Thank you for your interest!',
    reviewed_by: 'user-carlos',
    reviewed_at: daysAgo(5),
    created_at: daysAgo(8),
    updated_at: daysAgo(5),
  },
]

function adopterSummary(adopterId: string): AdopterSummary {
  const user = mockUsers.find((candidate) => candidate.id === adopterId)
  return {
    id: adopterId,
    full_name: user?.full_name ?? 'Unknown adopter',
    email: user?.email ?? '',
    phone: user?.phone ?? null,
    city: user?.city ?? null,
    state: user?.state ?? null,
  }
}

/** Embeds the pet and adopter, newest requests first. */
function withDetails(requests: AdoptionRequest[]): AdoptionRequestDetails[] {
  return requests
    .map((request) => ({ ...request, pet: findMockPet(request.pet_id), adopter: adopterSummary(request.adopter_id) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

/** Mock of `POST /adoption-requests`. */
export async function createMockAdoptionRequest(
  input: AdoptionRequestInput,
  signal?: AbortSignal,
): Promise<AdoptionRequest> {
  await mockDelay(signal)
  const user = requireMockUser('adopter')
  const pet = findMockPet(input.pet_id)

  if (pet.status !== 'available') {
    throw new ApiError(`${pet.name} is no longer available for adoption.`, 409, '/adoption-requests')
  }
  const hasOpenRequest = mockAdoptionRequests.some(
    (request) => request.pet_id === pet.id && request.adopter_id === user.id && request.status === 'pending',
  )
  if (hasOpenRequest) {
    throw new ApiError(`You already have a pending request for ${pet.name}.`, 409, '/adoption-requests')
  }

  const timestamp = nowIso()
  const request: AdoptionRequest = {
    ...input,
    id: `request-${crypto.randomUUID()}`,
    adopter_id: user.id,
    organization_id: pet.organization_id,
    status: 'pending',
    review_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  }
  mockAdoptionRequests.push(request)
  return request
}

/** Mock of `GET /adoption-requests/me`: the adopter's own requests. */
export async function listMockMyAdoptionRequests(signal?: AbortSignal): Promise<AdoptionRequestDetails[]> {
  await mockDelay(signal)
  const user = requireMockUser('adopter')
  return withDetails(mockAdoptionRequests.filter((request) => request.adopter_id === user.id))
}

/** Mock of `GET /organizations/me/adoption-requests`: the organization's inbox. */
export async function listMockOrganizationAdoptionRequests(signal?: AbortSignal): Promise<AdoptionRequestDetails[]> {
  await mockDelay(signal)
  const user = requireMockUser('organization_member')
  return withDetails(mockAdoptionRequests.filter((request) => request.organization_id === user.organization_id))
}

/** Mock of `PATCH /adoption-requests/{id}`: approve or reject a pending request. */
export async function decideMockAdoptionRequest(
  id: string,
  decision: AdoptionRequestDecision,
  signal?: AbortSignal,
): Promise<AdoptionRequest> {
  await mockDelay(signal, 300)
  const user = requireMockUser('organization_member')
  const path = `/adoption-requests/${id}`
  const request = mockAdoptionRequests.find((candidate) => candidate.id === id)

  if (!request || request.organization_id !== user.organization_id) {
    throw new ApiError('Adoption request not found.', 404, path)
  }
  if (request.status !== 'pending') {
    throw new ApiError('Only pending requests can be reviewed.', 409, path)
  }

  const timestamp = nowIso()
  request.status = decision.status
  request.review_note = decision.review_note?.trim() || null
  request.reviewed_by = user.id
  request.reviewed_at = timestamp
  request.updated_at = timestamp

  if (decision.status === 'approved') {
    const pet = findMockPet(request.pet_id)
    pet.status = 'pending'
    pet.updated_at = timestamp
  }
  return request
}
