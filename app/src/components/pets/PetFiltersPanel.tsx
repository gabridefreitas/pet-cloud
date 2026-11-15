import { Cat, ChevronDown, Dog, PawPrint, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PetFilters, PetSex, PetSize, PetSpecies } from '../../types'
import { AGE_GROUPS, CAT_BREEDS, COLOR_OPTIONS, DOG_BREEDS } from '../../utils/pets'

interface PetFiltersPanelProps {
  value: PetFilters
  onChange: (filters: PetFilters) => void
  onApply: () => void
  onReset: () => void
}

const SPECIES_OPTIONS: { value: PetSpecies; label: string; icon: LucideIcon }[] = [
  { value: 'cat', label: 'Cat', icon: Cat },
  { value: 'dog', label: 'Dog', icon: Dog },
]

const SIZE_OPTIONS: { value: PetSize; label: string; letter: string; iconClass: string }[] = [
  { value: 'small', label: 'Small', letter: 'S', iconClass: 'size-8' },
  { value: 'medium', label: 'Medium', letter: 'M', iconClass: 'size-10' },
  { value: 'large', label: 'Large', letter: 'L', iconClass: 'size-12' },
]

const SEX_OPTIONS: { value: PetSex | undefined; label: string }[] = [
  { value: undefined, label: 'Any' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
]

/** Adds the item if missing, removes it if present. Returns undefined when empty. */
function toggle<T>(list: T[] | undefined, item: T): T[] | undefined {
  const next = list?.includes(item) ? list.filter((value) => value !== item) : [...(list ?? []), item]
  return next.length > 0 ? next : undefined
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:border-brand-400 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-3 px-1">{children}</div>
    </details>
  )
}

const checkboxClass = 'size-4 rounded border-gray-300 accent-brand-600'

export function PetFiltersPanel({ value, onChange, onApply, onReset }: PetFiltersPanelProps) {
  const update = (patch: Partial<PetFilters>) => onChange({ ...value, ...patch })

  const breeds =
    value.species === 'cat' ? CAT_BREEDS : value.species === 'dog' ? DOG_BREEDS : [...new Set([...DOG_BREEDS, ...CAT_BREEDS])]

  return (
    <form
      aria-label="Pet filters"
      className="space-y-7"
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
    >
      <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-sm">
        <span className="font-medium text-brand-600">Filters</span>
        <button type="button" onClick={onReset} className="text-gray-500 hover:text-brand-600">
          Reset Filters
        </button>
      </div>

      <fieldset>
        <legend className="sr-only">Species</legend>
        <div className="flex justify-around gap-4">
          {SPECIES_OPTIONS.map(({ value: species, label, icon: Icon }) => {
            const selected = value.species === species
            return (
              <button
                key={species}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ species: selected ? undefined : species, breed: undefined })}
                className={`flex size-24 flex-col items-center justify-center gap-1 rounded-full border-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-brand-600 hover:border-brand-300'
                }`}
              >
                <Icon className="size-9" strokeWidth={1.5} aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="filter-location" className="text-sm font-medium text-gray-900">
          Location
        </label>
        <input
          id="filter-location"
          type="text"
          placeholder="City or state"
          value={value.location ?? ''}
          onChange={(event) => update({ location: event.target.value || undefined })}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900">Size</legend>
        <div className="mt-2 flex items-end justify-around">
          {SIZE_OPTIONS.map((option) => {
            const selected = value.size?.includes(option.value) ?? false
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                aria-label={option.label}
                onClick={() => update({ size: toggle(value.size, option.value) })}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors ${
                  selected ? 'bg-brand-50 text-brand-700' : 'text-brand-500 hover:bg-gray-50'
                }`}
              >
                <span className="relative grid place-items-center">
                  <PawPrint className={option.iconClass} strokeWidth={1.5} aria-hidden />
                  <span className="absolute bottom-0.5 text-[10px] font-bold">{option.letter}</span>
                </span>
                <span className="text-gray-700">{option.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <Section title="Breed">
        <ul className="max-h-64 space-y-2.5 overflow-y-auto pr-2">
          {breeds.map((breed) => (
            <li key={breed}>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-800">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={value.breed?.includes(breed) ?? false}
                  onChange={() => update({ breed: toggle(value.breed, breed) })}
                />
                {breed}
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Color">
        <ul className="space-y-2.5">
          {COLOR_OPTIONS.map((color) => (
            <li key={color.value}>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-800">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={value.color?.includes(color.value) ?? false}
                  onChange={() => update({ color: toggle(value.color, color.value) })}
                />
                <span className="size-3.5 rounded-full border border-gray-200" style={{ background: color.swatch }} aria-hidden />
                {color.label}
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Gender">
        <div className="space-y-2.5">
          {SEX_OPTIONS.map((option) => (
            <label key={option.label} className="flex cursor-pointer items-center gap-3 text-sm text-gray-800">
              <input
                type="radio"
                name="sex"
                className="size-4 accent-brand-600"
                checked={value.sex === option.value}
                onChange={() => update({ sex: option.value })}
              />
              {option.label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Age" defaultOpen={false}>
        <ul className="space-y-2.5">
          {AGE_GROUPS.map((group) => (
            <li key={group.value}>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-800">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={value.age?.includes(group.value) ?? false}
                  onChange={() => update({ age: toggle(value.age, group.value) })}
                />
                {group.label}
              </label>
            </li>
          ))}
        </ul>
      </Section>

      <div className="flex justify-center">
        <button
          type="submit"
          className="rounded-md border border-brand-600 px-5 py-2.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-600 hover:text-white"
        >
          Apply your Filter
        </button>
      </div>
    </form>
  )
}
