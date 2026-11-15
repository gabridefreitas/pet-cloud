import type { AgeGroup, Pet, PetColor, PetSex, PetSize } from '../types'

/** Pets listed within this many days get the "New" badge. */
const NEW_PET_DAYS = 7

export const SIZE_LABELS: Record<PetSize, string> = { small: 'Small', medium: 'Medium', large: 'Large' }
export const SEX_LABELS: Record<PetSex, string> = { male: 'Male', female: 'Female' }

export const COLOR_OPTIONS: { value: PetColor; label: string; swatch: string }[] = [
  { value: 'golden', label: 'Golden', swatch: '#d9a066' },
  { value: 'brown', label: 'Brown', swatch: '#7a4a24' },
  { value: 'gray', label: 'Gray', swatch: '#9ca3af' },
  { value: 'black', label: 'Black', swatch: '#111827' },
  { value: 'red', label: 'Red', swatch: '#ef4444' },
  { value: 'bicolor', label: 'Bicolor', swatch: 'linear-gradient(135deg, #7a4a24 50%, #f5f5f4 50%)' },
  { value: 'brindle', label: 'Brindle', swatch: 'repeating-linear-gradient(45deg, #7a4a24 0 3px, #c4a27a 3px 6px)' },
]

/** Age ranges in months: [min, max). The API must use the same ranges. */
export const AGE_GROUPS: { value: AgeGroup; label: string; range: [number, number] }[] = [
  { value: 'baby', label: 'Baby (under 1 year)', range: [0, 12] },
  { value: 'young', label: 'Young (1–3 years)', range: [12, 36] },
  { value: 'adult', label: 'Adult (3–8 years)', range: [36, 96] },
  { value: 'senior', label: 'Senior (8+ years)', range: [96, Infinity] },
]

export const DOG_BREEDS = [
  'German Shepherd',
  'Bulldog',
  'Labrador Retriever',
  'Golden Retriever',
  'Beagle',
  'Pit Bull',
  'Shiba Inu',
  'Russell Terrier',
  'Cavalier King Charles Spaniel',
  'Pembroke Welsh Corgi',
  'Poodle',
  'Rottweiler',
  'Siberian Husky',
  'Mixed Breed',
]

export const CAT_BREEDS = [
  'Domestic Long Hair',
  'Domestic Short Hair',
  'Scottish Fold',
  'Manx',
  'Munchkin',
  'Toyger',
  'Siamese',
  'Persian',
  'Maine Coon',
  'Mixed Breed',
]

export function isInAgeGroup(ageMonths: number, group: AgeGroup): boolean {
  const range = AGE_GROUPS.find((option) => option.value === group)?.range
  return range !== undefined && ageMonths >= range[0] && ageMonths < range[1]
}

export function formatAge(ageMonths: number): string {
  if (ageMonths < 24) return ageMonths === 1 ? '1 month' : `${ageMonths} months`
  const years = Math.floor(ageMonths / 12)
  return `${years} years`
}

export function isNewPet(pet: Pet, now = Date.now()): boolean {
  return now - new Date(pet.created_at).getTime() < NEW_PET_DAYS * 24 * 60 * 60 * 1000
}

export function primaryPhotoUrl(pet: Pet): string | null {
  const photo = pet.photos.find((item) => item.is_primary) ?? pet.photos[0]
  return photo?.url ?? null
}
