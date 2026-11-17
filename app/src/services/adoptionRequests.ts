/**
 * Adoption request endpoints. While `USE_MOCKS` is on, the in-memory mock
 * answers instead (see `src/mocks/adoptionRequests.ts` for the business rules).
 */
import {
  createMockAdoptionRequest,
  decideMockAdoptionRequest,
  listMockMyAdoptionRequests,
  listMockOrganizationAdoptionRequests,
} from '../mocks/adoptionRequests'
import type {
  AdoptionRequest,
  AdoptionRequestDecision,
  AdoptionRequestDetails,
  AdoptionRequestInput,
} from '../types'
import { api, USE_MOCKS } from './api'

/** `POST /adoption-requests` — an adopter asks to adopt a pet. */
export function createAdoptionRequest(input: AdoptionRequestInput, signal?: AbortSignal): Promise<AdoptionRequest> {
  if (USE_MOCKS) return createMockAdoptionRequest(input, signal)
  return api.post<AdoptionRequest>('/adoption-requests', input, { signal })
}

/** `GET /adoption-requests/me` — requests sent by the logged-in adopter. */
export function listMyAdoptionRequests(signal?: AbortSignal): Promise<AdoptionRequestDetails[]> {
  if (USE_MOCKS) return listMockMyAdoptionRequests(signal)
  return api.get<AdoptionRequestDetails[]>('/adoption-requests/me', { signal })
}

/** `GET /organizations/me/adoption-requests` — requests received by the member's organization. */
export function listOrganizationAdoptionRequests(signal?: AbortSignal): Promise<AdoptionRequestDetails[]> {
  if (USE_MOCKS) return listMockOrganizationAdoptionRequests(signal)
  return api.get<AdoptionRequestDetails[]>('/organizations/me/adoption-requests', { signal })
}

/** `PATCH /adoption-requests/{id}` — the organization approves or rejects a pending request. */
export function decideAdoptionRequest(
  id: string,
  decision: AdoptionRequestDecision,
  signal?: AbortSignal,
): Promise<AdoptionRequest> {
  if (USE_MOCKS) return decideMockAdoptionRequest(id, decision, signal)
  return api.patch<AdoptionRequest>(`/adoption-requests/${encodeURIComponent(id)}`, decision, { signal })
}
