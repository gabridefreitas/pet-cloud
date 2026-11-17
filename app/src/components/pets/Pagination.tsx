interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

const baseClass = 'grid h-9 min-w-9 place-items-center rounded-md border px-2 text-sm transition-colors'

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${baseClass} border-gray-200 text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent`}
      >
        Prev
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
          className={`${baseClass} ${
            number === page
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-gray-200 text-brand-600 hover:bg-brand-50'
          }`}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className={`${baseClass} border-gray-200 text-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent`}
      >
        Next
      </button>
    </nav>
  )
}
