/**
 * Shared domain types for the PetCloud web app.
 *
 * Field names use snake_case so they match the PostgreSQL (RDS) columns and
 * the JSON returned by the FastAPI backend without a mapping layer. No schema
 * migration tooling is used: these types are the contract implemented by the
 * API's Pydantic models.
 */

/** UUID primary key. */
export type Id = string

/** ISO 8601 timestamp, e.g. "2026-11-14T12:00:00Z". */
export type IsoDateTime = string

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export type UserRole = 'adopter' | 'organization_member'

/** A person using the platform. Credentials are never exposed to the client. */
export interface User {
  id: Id
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  /** Set only for organization members. */
  organization_id: Id | null
  city: string | null
  state: string | null
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

// ---------------------------------------------------------------------------
// Organization (shelter, NGO, or independent rescuer)
// ---------------------------------------------------------------------------

export interface Organization {
  id: Id
  name: string
  description: string | null
  email: string
  phone: string | null
  address: string | null
  city: string
  state: string
  country: string
  /** S3 object key of the logo; the API resolves it to `logo_url`. */
  logo_key: string | null
  logo_url: string | null
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

// ---------------------------------------------------------------------------
// Pet
// ---------------------------------------------------------------------------

export type PetSpecies = 'cat' | 'dog'
export type PetSex = 'male' | 'female'
export type PetSize = 'small' | 'medium' | 'large'
export type PetColor =
  | 'golden'
  | 'brown'
  | 'gray'
  | 'black'
  | 'red'
  | 'bicolor'
  | 'brindle'

/**
 * - available: listed in the catalog and open to requests
 * - pending: a request was approved and the handover is in progress
 * - adopted: the adoption is complete
 * - unavailable: temporarily hidden by the organization (e.g. medical care)
 */
export type PetStatus = 'available' | 'pending' | 'adopted' | 'unavailable'

/**
 * A pet photo. The database stores only the S3 object key; the API returns a
 * readable `url` (CloudFront or presigned) that the UI renders.
 */
export interface PetPhoto {
  id: Id
  pet_id: Id
  s3_key: string
  url: string
  is_primary: boolean
  position: number
}

export interface Pet {
  id: Id
  organization_id: Id
  name: string
  species: PetSpecies
  breed: string
  sex: PetSex
  /** Age in months; the UI formats it as "14 months" or "5 years". */
  age_months: number
  size: PetSize
  color: PetColor
  description: string
  /** Free-text health history (treatments, conditions, special needs). */
  health_notes: string | null
  is_vaccinated: boolean
  is_neutered: boolean
  status: PetStatus
  city: string
  state: string
  country: string
  photos: PetPhoto[]
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

/** Pet with its organization embedded, as returned by the details endpoint. */
export interface PetDetails extends Pet {
  organization: Organization
}

/** Payload for creating or editing a pet. Photos are uploaded separately. */
export type PetInput = Omit<
  Pet,
  'id' | 'organization_id' | 'photos' | 'created_at' | 'updated_at'
>

export interface PetStatusUpdate {
  status: PetStatus
}

// ---------------------------------------------------------------------------
// Adoption request
// ---------------------------------------------------------------------------

export type AdoptionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type HousingType = 'house' | 'apartment' | 'other'

export interface AdoptionRequest {
  id: Id
  pet_id: Id
  adopter_id: Id
  /** Denormalized from the pet so organizations can list their inbox directly. */
  organization_id: Id
  status: AdoptionRequestStatus
  message: string
  housing_type: HousingType
  has_children: boolean
  has_other_pets: boolean
  /** Note left by the organization when approving or rejecting. */
  review_note: string | null
  reviewed_by: Id | null
  reviewed_at: IsoDateTime | null
  created_at: IsoDateTime
  updated_at: IsoDateTime
}

export type AdoptionRequestInput = Pick<
  AdoptionRequest,
  'pet_id' | 'message' | 'housing_type' | 'has_children' | 'has_other_pets'
>

export interface AdoptionRequestDecision {
  status: Extract<AdoptionRequestStatus, 'approved' | 'rejected'>
  review_note?: string
}

/** Public contact data of the adopter, shown to the organization reviewing a request. */
export type AdopterSummary = Pick<User, 'id' | 'full_name' | 'email' | 'phone' | 'city' | 'state'>

/** Adoption request with the pet and adopter embedded, as returned by list endpoints. */
export interface AdoptionRequestDetails extends AdoptionRequest {
  pet: Pet
  adopter: AdopterSummary
}

// ---------------------------------------------------------------------------
// Catalog filters ("Adopt a pet" screen)
// ---------------------------------------------------------------------------

/** Age ranges shown in the "Age" filter. The API maps them to `age_months`. */
export type AgeGroup = 'baby' | 'young' | 'adult' | 'senior'

/**
 * Query parameters for `GET /pets`. Declared as a type alias (not an
 * interface) so it can be passed directly as query params. Array values are
 * sent as repeated params, e.g. `?size=small&size=medium`.
 */
export type PetFilters = {
  species?: PetSpecies
  /** City name or ZIP code typed in the "Location" field. */
  location?: string
  size?: PetSize[]
  breed?: string[]
  color?: PetColor[]
  sex?: PetSex
  age?: AgeGroup[]
  /** Defaults to "available" on the server for the public catalog. */
  status?: PetStatus
  page?: number
  page_size?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface LoginInput {
  email: string
  password: string
}

/** Self sign-up creates adopter accounts. Organization accounts are created by the team. */
export interface RegisterInput {
  full_name: string
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
}

// ---------------------------------------------------------------------------
// API errors
// ---------------------------------------------------------------------------

/** FastAPI/Pydantic validation issue, as returned in `detail` on HTTP 422. */
export interface ValidationIssue {
  loc: (string | number)[]
  msg: string
  type: string
}

/** FastAPI error body: `{ "detail": "..." }` or a list of validation issues. */
export interface ApiErrorBody {
  detail: string | ValidationIssue[]
}
