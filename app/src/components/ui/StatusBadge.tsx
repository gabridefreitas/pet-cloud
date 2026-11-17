import type { AdoptionRequestStatus, PetStatus } from '../../types'

type Status = PetStatus | AdoptionRequestStatus

const STYLES: Record<Status, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  adopted: { label: 'Adopted', className: 'bg-brand-50 text-brand-700 ring-brand-200' },
  unavailable: { label: 'Unavailable', className: 'bg-gray-100 text-gray-600 ring-gray-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 ring-red-200' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 ring-gray-200' },
}

/** Colored pill for pet availability and adoption request status. */
export function StatusBadge({ status }: { status: Status }) {
  const style = STYLES[status]
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.className}`}>
      {style.label}
    </span>
  )
}
