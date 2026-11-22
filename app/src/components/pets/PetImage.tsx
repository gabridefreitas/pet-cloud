import { PawPrint } from 'lucide-react'
import { useState } from 'react'

interface PetImageProps {
  src: string | null
  alt: string
  className?: string
}

/**
 * Image from S3/CloudFront with a skeleton while loading and a placeholder
 * when the URL is missing or fails (expired presigned URL, deleted object).
 */
export function PetImage({ src, alt, className = '' }: PetImageProps) {
  const [result, setResult] = useState<{ src: string; status: 'loaded' | 'error' } | null>(null)
  const status = !src ? 'error' : result?.src === src ? result.status : 'loading'

  return (
    <div className={`relative overflow-hidden bg-brand-50 ${className}`}>
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-brand-100" aria-hidden />}

      {status === 'error' || !src ? (
        <div className="absolute inset-0 grid place-items-center text-brand-300" role="img" aria-label={alt}>
          <PawPrint className="size-12" aria-hidden />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setResult({ src, status: 'loaded' })}
          onError={() => setResult({ src, status: 'error' })}
          className={`size-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
