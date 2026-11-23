import { ImagePlus, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { inputClass, labelClass, outlineButtonClass, primaryButtonClass } from '../../components/ui/styles'
import { createPet, PHOTO_CONTENT_TYPES, uploadPetPhoto, validatePhoto } from '../../services/pets'
import type { PetColor, PetInput, PetSex, PetSize, PetSpecies } from '../../types'
import { CAT_BREEDS, COLOR_OPTIONS, DOG_BREEDS, SEX_LABELS, SIZE_LABELS } from '../../utils/pets'

const MAX_PHOTOS = 5
const MIN_DESCRIPTION_LENGTH = 20

/** A photo chosen in the form, with a local preview URL (revoked when removed). */
interface SelectedPhoto {
  file: File
  previewUrl: string
}

/** Form values; age is entered as years + months and converted to `age_months`. */
interface FormValues {
  name: string
  species: PetSpecies
  breed: string
  sex: PetSex
  ageYears: string
  ageMonths: string
  size: PetSize
  color: PetColor
  description: string
  health_notes: string
  is_vaccinated: boolean
  is_neutered: boolean
  city: string
  state: string
  country: string
}

const INITIAL_VALUES: FormValues = {
  name: '',
  species: 'dog',
  breed: '',
  sex: 'male',
  ageYears: '0',
  ageMonths: '0',
  size: 'medium',
  color: 'brown',
  description: '',
  health_notes: '',
  is_vaccinated: false,
  is_neutered: false,
  city: '',
  state: '',
  country: '',
}

/** Returns the API payload, or an error message when a field is invalid. */
function toPetInput(values: FormValues): PetInput | string {
  const ageMonths = Number(values.ageYears) * 12 + Number(values.ageMonths)
  if (!values.name.trim()) return 'Enter the pet name.'
  if (!values.breed.trim()) return 'Enter the breed (or "Mixed Breed").'
  if (!Number.isInteger(ageMonths) || ageMonths < 1) return 'Enter an age of at least 1 month.'
  if (!values.city.trim() || !values.state.trim() || !values.country.trim()) return 'Enter the city, state, and country.'
  if (values.description.trim().length < MIN_DESCRIPTION_LENGTH) {
    return `Write a description with at least ${MIN_DESCRIPTION_LENGTH} characters.`
  }
  return {
    name: values.name.trim(),
    species: values.species,
    breed: values.breed.trim(),
    sex: values.sex,
    age_months: ageMonths,
    size: values.size,
    color: values.color,
    description: values.description.trim(),
    health_notes: values.health_notes.trim() || null,
    is_vaccinated: values.is_vaccinated,
    is_neutered: values.is_neutered,
    status: 'available',
    city: values.city.trim(),
    state: values.state.trim(),
    country: values.country.trim(),
  }
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

/**
 * Organization form to register a new pet. On submit it creates the pet
 * (`POST /pets`) and then sends each photo to the API for S3 storage.
 */
export function PetFormPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [photos, setPhotos] = useState<SelectedPhoto[]>([])
  const [uploadedPhotoCount, setUploadedPhotoCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  /** Set when the pet was created but a photo failed, so the user is not stuck. */
  const [createdPetId, setCreatedPetId] = useState<string | null>(null)

  // Revoke preview URLs when leaving the page, to free memory.
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  }, [photos])
  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)), [])

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))

  function addPhotos(files: FileList | null) {
    if (!files) return
    const room = MAX_PHOTOS - uploadedPhotoCount - photos.length
    const accepted: SelectedPhoto[] = []
    const problems: string[] = []
    for (const file of Array.from(files)) {
      const problem = validatePhoto(file)
      if (problem) problems.push(problem)
      else if (accepted.length < room) accepted.push({ file, previewUrl: URL.createObjectURL(file) })
      else problems.push(`${file.name}: the limit is ${MAX_PHOTOS} photos.`)
    }
    setError(problems.length > 0 ? problems.join(' ') : null)
    setPhotos([...photos, ...accepted])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].previewUrl)
    setPhotos((current) => current.filter((_, position) => position !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const input = toPetInput(values)
    if (typeof input === 'string') {
      setError(input)
      return
    }
    setError(null)
    setProgress('Saving pet…')
    let petId: string | null = createdPetId
    try {
      if (!petId) {
        petId = (await createPet(input)).id
        setCreatedPetId(petId)
      }
      for (const [index, photo] of photos.entries()) {
        setProgress(`Uploading photo ${index + 1} of ${photos.length}…`)
        await uploadPetPhoto(petId, photo.file)
        URL.revokeObjectURL(photo.previewUrl)
        setUploadedPhotoCount((current) => current + 1)
        setPhotos((current) => current.filter((selected) => selected !== photo))
      }
      navigate('/organization?tab=pets')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Something went wrong.'
      setError(petId ? `The pet was saved, but a photo upload failed: ${message}` : message)
      setCreatedPetId(petId)
      setProgress(null)
    }
  }

  const breeds = values.species === 'cat' ? CAT_BREEDS : DOG_BREEDS
  const submitting = progress !== null

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Home', to: '/' }, { label: 'Organization portal', to: '/organization?tab=pets' }, { label: 'New pet' }]}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-brand-900">Register a new pet</h1>
        <p className="mt-1 text-sm text-gray-600">The pet appears in the catalog as soon as it is saved.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8" noValidate>
          <fieldset disabled={submitting || createdPetId !== null} className="space-y-5">
            <legend className="mb-4 font-semibold text-brand-900">Basic information</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" htmlFor="pet-name">
                <input id="pet-name" required value={values.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Species" htmlFor="pet-species">
                <select id="pet-species" value={values.species} onChange={(e) => update('species', e.target.value as PetSpecies)} className={inputClass}>
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                </select>
              </Field>
              <Field label="Breed" htmlFor="pet-breed">
                <input id="pet-breed" list="pet-breed-options" required value={values.breed} onChange={(e) => update('breed', e.target.value)} className={inputClass} />
                <datalist id="pet-breed-options">
                  {breeds.map((breed) => (
                    <option key={breed} value={breed} />
                  ))}
                </datalist>
              </Field>
              <Field label="Gender" htmlFor="pet-sex">
                <select id="pet-sex" value={values.sex} onChange={(e) => update('sex', e.target.value as PetSex)} className={inputClass}>
                  {(Object.keys(SEX_LABELS) as PetSex[]).map((sex) => (
                    <option key={sex} value={sex}>
                      {SEX_LABELS[sex]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age (years)" htmlFor="pet-age-years">
                  <input id="pet-age-years" type="number" min={0} max={30} value={values.ageYears} onChange={(e) => update('ageYears', e.target.value)} className={inputClass} />
                </Field>
                <Field label="+ months" htmlFor="pet-age-months">
                  <input id="pet-age-months" type="number" min={0} max={11} value={values.ageMonths} onChange={(e) => update('ageMonths', e.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Size" htmlFor="pet-size">
                <select id="pet-size" value={values.size} onChange={(e) => update('size', e.target.value as PetSize)} className={inputClass}>
                  {(Object.keys(SIZE_LABELS) as PetSize[]).map((size) => (
                    <option key={size} value={size}>
                      {SIZE_LABELS[size]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Color" htmlFor="pet-color">
                <select id="pet-color" value={values.color} onChange={(e) => update('color', e.target.value as PetColor)} className={inputClass}>
                  {COLOR_OPTIONS.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Description" htmlFor="pet-description">
              <textarea
                id="pet-description"
                rows={4}
                required
                value={values.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Personality, routine, and the kind of home that suits this pet."
                className={`${inputClass} resize-y`}
              />
            </Field>
          </fieldset>

          <fieldset disabled={submitting || createdPetId !== null} className="space-y-5">
            <legend className="mb-4 font-semibold text-brand-900">Health</legend>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" className="size-4 accent-brand-600" checked={values.is_vaccinated} onChange={(e) => update('is_vaccinated', e.target.checked)} />
                Vaccinated
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" className="size-4 accent-brand-600" checked={values.is_neutered} onChange={(e) => update('is_neutered', e.target.checked)} />
                Neutered / spayed
              </label>
            </div>
            <Field label="Health notes (optional)" htmlFor="pet-health">
              <textarea
                id="pet-health"
                rows={3}
                value={values.health_notes}
                onChange={(e) => update('health_notes', e.target.value)}
                placeholder="Treatments, conditions, or special needs."
                className={`${inputClass} resize-y`}
              />
            </Field>
          </fieldset>

          <fieldset disabled={submitting || createdPetId !== null} className="space-y-5">
            <legend className="mb-4 font-semibold text-brand-900">Location</legend>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="City" htmlFor="pet-city">
                <input id="pet-city" required value={values.city} onChange={(e) => update('city', e.target.value)} className={inputClass} />
              </Field>
              <Field label="State" htmlFor="pet-state">
                <input id="pet-state" required value={values.state} onChange={(e) => update('state', e.target.value)} className={inputClass} />
              </Field>
              <Field label="Country" htmlFor="pet-country">
                <input id="pet-country" required value={values.country} onChange={(e) => update('country', e.target.value)} className={inputClass} />
              </Field>
            </div>
          </fieldset>

          <fieldset disabled={submitting}>
            <legend className="font-semibold text-brand-900">Photos (optional)</legend>
            <p className="mt-1 text-sm text-gray-600">
              Up to {MAX_PHOTOS} images (JPEG, PNG, or WebP, 5 MB each). The first one is the cover photo.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <div key={photo.previewUrl} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200">
                  <img src={photo.previewUrl} alt={`Selected photo ${index + 1}`} className="size-full object-cover" />
                  {index === 0 && uploadedPhotoCount === 0 && (
                    <span className="absolute top-2 left-2 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Cover</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-gray-700 shadow hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              {photos.length + uploadedPhotoCount < MAX_PHOTOS && (
                <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-200 text-sm text-brand-600 transition-colors hover:border-brand-400 hover:bg-brand-50">
                  <ImagePlus className="size-7" aria-hidden />
                  Add photos
                  <input
                    type="file"
                    accept={PHOTO_CONTENT_TYPES.join(',')}
                    multiple
                    className="sr-only"
                    onChange={(event) => {
                      addPhotos(event.target.files)
                      event.target.value = '' // allow selecting the same file again
                    }}
                  />
                </label>
              )}
            </div>
          </fieldset>

          {error && (
            <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              {createdPetId && (
                <Link to="/organization?tab=pets" className="ml-2 font-medium underline">
                  Go to your pets
                </Link>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            <Link to="/organization?tab=pets" className={outlineButtonClass}>
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {progress ?? (createdPetId ? 'Finish uploading photos' : 'Save pet')}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
