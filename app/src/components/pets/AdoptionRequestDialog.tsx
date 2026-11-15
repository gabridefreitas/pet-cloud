import { CircleCheck, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createAdoptionRequest } from '../../services/adoptionRequests'
import type { HousingType, Pet } from '../../types'
import { HOUSING_LABELS } from '../../utils/pets'
import { inputClass, labelClass, outlineButtonClass, primaryButtonClass } from '../ui/styles'

interface AdoptionRequestDialogProps {
  pet: Pick<Pet, 'id' | 'name'>
  open: boolean
  onClose: () => void
}

const MIN_MESSAGE_LENGTH = 30

/**
 * Modal form that sends an `AdoptionRequest` for a pet.
 *
 * Uses the native `<dialog>` element, which provides focus trapping, Esc to
 * close, and the backdrop without extra dependencies.
 */
export function AdoptionRequestDialog({ pet, open, onClose }: AdoptionRequestDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [housingType, setHousingType] = useState<HousingType>('house')
  const [hasChildren, setHasChildren] = useState(false)
  const [hasOtherPets, setHasOtherPets] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Sync the `open` prop with the imperative dialog API.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      setError(`Please tell the organization a bit more (at least ${MIN_MESSAGE_LENGTH} characters).`)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createAdoptionRequest({
        pet_id: pet.id,
        housing_type: housingType,
        has_children: hasChildren,
        has_other_pets: hasOtherPets,
        message: message.trim(),
      })
      setSubmitted(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not send your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="adoption-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl p-0 shadow-xl backdrop:bg-brand-900/40"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 id="adoption-dialog-title" className="text-lg font-semibold text-brand-900">
          Adopt {pet.name}
        </h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
          <X className="size-5" aria-hidden />
        </button>
      </div>

      {submitted ? (
        <div className="flex flex-col items-center px-6 py-10 text-center" role="status">
          <CircleCheck className="size-12 text-emerald-500" aria-hidden />
          <p className="mt-4 font-semibold text-brand-900">Request submitted!</p>
          <p className="mt-2 text-sm text-gray-600">
            The organization will review your request. You can follow its status at any time.
          </p>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className={outlineButtonClass}>
              Close
            </button>
            <Link to="/my-requests" className={primaryButtonClass}>
              View my requests
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5" noValidate>
          <p className="text-sm text-gray-600">
            Tell the organization about your home and routine so they can check that it's the right fit for {pet.name}.
          </p>

          <fieldset>
            <legend className={labelClass}>Where do you live?</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              {(Object.keys(HOUSING_LABELS) as HousingType[]).map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="housing_type"
                    className="size-4 accent-brand-600"
                    checked={housingType === type}
                    onChange={() => setHousingType(type)}
                  />
                  {HOUSING_LABELS[type]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="size-4 accent-brand-600"
                checked={hasChildren}
                onChange={(event) => setHasChildren(event.target.checked)}
              />
              There are children in my home
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="size-4 accent-brand-600"
                checked={hasOtherPets}
                onChange={(event) => setHasOtherPets(event.target.checked)}
              />
              I have other pets
            </label>
          </div>

          <div>
            <label htmlFor="adoption-message" className={labelClass}>
              Why would you like to adopt {pet.name}?
            </label>
            <textarea
              id="adoption-message"
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe your routine, experience with pets, and how you will take care of them."
              className={`${inputClass} mt-2 resize-y`}
              aria-describedby="adoption-message-hint"
              required
            />
            <p id="adoption-message-hint" className="mt-1 text-xs text-gray-500">
              At least {MIN_MESSAGE_LENGTH} characters.
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className={outlineButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={primaryButtonClass}>
              {submitting ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
