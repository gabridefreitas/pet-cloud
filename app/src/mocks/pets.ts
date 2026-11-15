/**
 * Mock data based on the "Adopt a pet" design reference. Used to build and
 * review screens before the API endpoints exist; delete once they do.
 *
 * Photos live in `public/mock-pets/` and are reused across cards. In
 * production, photo URLs come from S3 via the API.
 */
import type { Organization, Paginated, Pet, PetColor, PetFilters, PetSex, PetSize, PetSpecies } from '../types'
import { isInAgeGroup } from '../utils/pets'

const MOCK_PHOTOS = ['bulldog', 'boston-terrier', 'golden-retriever'] as const
type MockPhoto = (typeof MOCK_PHOTOS)[number]

const PHOTO_BY_NAME: Record<string, MockPhoto> = {
  Pitter: 'bulldog',
  Snoopy: 'boston-terrier',
  Lola: 'golden-retriever',
  Balto: 'golden-retriever',
  Shadow: 'golden-retriever',
  Magie: 'golden-retriever',
  Max: 'bulldog',
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const SEED_DATE = '2026-10-01T12:00:00Z'

export const mockOrganizations: Organization[] = [
  {
    id: 'org-happy-paws',
    name: 'Happy Paws Shelter',
    description: 'Rescuing and rehoming dogs and cats since 2012.',
    email: 'contact@happypaws.example',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street',
    city: 'Anytown',
    state: 'California',
    country: 'USA',
    logo_key: null,
    logo_url: null,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
  {
    id: 'org-second-chance',
    name: 'Second Chance Rescue',
    description: 'Volunteer network of foster homes across the South.',
    email: 'hello@secondchance.example',
    phone: '+1 (555) 987-6543',
    address: null,
    city: 'Austin',
    state: 'Texas',
    country: 'USA',
    logo_key: null,
    logo_url: null,
    created_at: SEED_DATE,
    updated_at: SEED_DATE,
  },
]

interface MockPetSeed {
  name: string
  species: PetSpecies
  breed: string
  sex: PetSex
  age_months: number
  size: PetSize
  color: PetColor
  state: string
  city: string
  description: string
  organization_id: string
  created_days_ago: number
}

const seeds: MockPetSeed[] = [
  {
    name: 'Pitter',
    species: 'dog',
    breed: 'Pit Bull',
    sex: 'male',
    age_months: 60,
    size: 'large',
    color: 'brown',
    city: 'Los Angeles',
    state: 'California',
    description: 'Pitter is a friendly, playful, smart male dog. Only adopted to a home with a fenced yard.',
    organization_id: 'org-happy-paws',
    created_days_ago: 2,
  },
  {
    name: 'Hero',
    species: 'cat',
    breed: 'Domestic Long Hair',
    sex: 'male',
    age_months: 24,
    size: 'small',
    color: 'gray',
    city: 'Austin',
    state: 'Texas',
    description: 'Hero is a playful, smart male cat. You can keep him in an apartment as long as he has toys.',
    organization_id: 'org-second-chance',
    created_days_ago: 30,
  },
  {
    name: 'Magie',
    species: 'dog',
    breed: 'Shiba Inu',
    sex: 'female',
    age_months: 14,
    size: 'medium',
    color: 'red',
    city: 'Miami',
    state: 'Florida',
    description:
      'Magie currently lives with two children age 7 and 13 and has mastered basic commands. She loves long walks.',
    organization_id: 'org-second-chance',
    created_days_ago: 21,
  },
  {
    name: 'Lola',
    species: 'dog',
    breed: 'Golden Retriever',
    sex: 'female',
    age_months: 14,
    size: 'medium',
    color: 'golden',
    city: 'Nashville',
    state: 'Tennessee',
    description: 'Lola is a friendly, playful, smart female dog. Only adopted to a home with a garden.',
    organization_id: 'org-second-chance',
    created_days_ago: 18,
  },
  {
    name: 'Felix',
    species: 'cat',
    breed: 'Scottish Fold',
    sex: 'female',
    age_months: 27,
    size: 'medium',
    color: 'red',
    city: 'Phoenix',
    state: 'Arizona',
    description:
      'Felix currently lives with two children age 7 and 13 and has met other cats. She loves waking up early.',
    organization_id: 'org-happy-paws',
    created_days_ago: 40,
  },
  {
    name: 'Snoopy',
    species: 'dog',
    breed: 'Russell Terrier',
    sex: 'male',
    age_months: 48,
    size: 'large',
    color: 'bicolor',
    city: 'Columbus',
    state: 'Ohio',
    description: 'Snoopy is a playful, smart male dog. You can keep him in an apartment with daily walks.',
    organization_id: 'org-happy-paws',
    created_days_ago: 35,
  },
  {
    name: 'Balto',
    species: 'dog',
    breed: 'Golden Retriever',
    sex: 'male',
    age_months: 36,
    size: 'large',
    color: 'golden',
    city: 'Detroit',
    state: 'Michigan',
    description: 'Balto is a friendly, playful, smart male dog. Only adopted to a home with an active family.',
    organization_id: 'org-happy-paws',
    created_days_ago: 50,
  },
  {
    name: 'Nala',
    species: 'cat',
    breed: 'Manx',
    sex: 'female',
    age_months: 16,
    size: 'medium',
    color: 'gray',
    city: 'Birmingham',
    state: 'Alabama',
    description: 'Nala is a playful, smart female cat. You can keep her in an apartment; she is very calm.',
    organization_id: 'org-second-chance',
    created_days_ago: 27,
  },
  {
    name: 'Max',
    species: 'dog',
    breed: 'German Shepherd',
    sex: 'male',
    age_months: 1,
    size: 'small',
    color: 'brown',
    city: 'Louisville',
    state: 'Kentucky',
    description: 'Max is a friendly, smart male puppy. You can keep him in an apartment while he is small.',
    organization_id: 'org-second-chance',
    created_days_ago: 1,
  },
  {
    name: 'Cheshire',
    species: 'cat',
    breed: 'Munchkin',
    sex: 'female',
    age_months: 6,
    size: 'small',
    color: 'bicolor',
    city: 'Omaha',
    state: 'Nebraska',
    description: 'Cheshire is a playful, smart female kitten. You can keep her in an apartment.',
    organization_id: 'org-happy-paws',
    created_days_ago: 12,
  },
  {
    name: 'Shadow',
    species: 'dog',
    breed: 'Golden Retriever',
    sex: 'male',
    age_months: 36,
    size: 'large',
    color: 'red',
    city: 'Jackson',
    state: 'Mississippi',
    description: 'Shadow is a playful, smart male dog who loves swimming. Best with a backyard.',
    organization_id: 'org-second-chance',
    created_days_ago: 45,
  },
  {
    name: 'Simba',
    species: 'cat',
    breed: 'Toyger',
    sex: 'female',
    age_months: 9,
    size: 'medium',
    color: 'gray',
    city: 'Las Vegas',
    state: 'Nevada',
    description: 'Simba is a playful, smart female cat. You can keep her in an apartment.',
    organization_id: 'org-happy-paws',
    created_days_ago: 15,
  },
]

export const mockPets: Pet[] = seeds.map((seed, index) => {
  const id = `pet-${seed.name.toLowerCase()}`
  const createdAt = daysAgo(seed.created_days_ago)
  const { created_days_ago: _createdDaysAgo, ...fields } = seed
  return {
    ...fields,
    id,
    health_notes: index % 3 === 0 ? 'Dewormed. Annual check-up done.' : null,
    is_vaccinated: true,
    is_neutered: seed.age_months >= 6,
    status: 'available',
    country: 'USA',
    photos: [
      {
        id: `${id}-photo-1`,
        pet_id: id,
        s3_key: `pets/${id}/1.jpg`,
        url: `/mock-pets/${PHOTO_BY_NAME[seed.name] ?? MOCK_PHOTOS[index % MOCK_PHOTOS.length]}.png`,
        is_primary: true,
        position: 0,
      },
    ],
    created_at: createdAt,
    updated_at: createdAt,
  }
})

/** The four pets shown in the landing page showcase. */
export const featuredMockPets = mockPets.slice(0, 4)

/** Simulated network latency so loading states are visible. */
const MOCK_DELAY_MS = 400

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    })
  })
}

/** In-memory version of `GET /pets`, applying the same filters the API will. */
export async function listMockPets(filters: PetFilters, signal?: AbortSignal): Promise<Paginated<Pet>> {
  await wait(MOCK_DELAY_MS, signal)

  const location = filters.location?.trim().toLowerCase()
  const status = filters.status ?? 'available'
  const matches = mockPets.filter(
    (pet) =>
      pet.status === status &&
      (!filters.species || pet.species === filters.species) &&
      (!filters.sex || pet.sex === filters.sex) &&
      (!location || `${pet.city} ${pet.state}`.toLowerCase().includes(location)) &&
      (!filters.size?.length || filters.size.includes(pet.size)) &&
      (!filters.breed?.length || filters.breed.includes(pet.breed)) &&
      (!filters.color?.length || filters.color.includes(pet.color)) &&
      (!filters.age?.length || filters.age.some((group) => isInAgeGroup(pet.age_months, group))),
  )

  const page = filters.page ?? 1
  const pageSize = filters.page_size ?? 9
  const start = (page - 1) * pageSize
  return { items: matches.slice(start, start + pageSize), total: matches.length, page, page_size: pageSize }
}
