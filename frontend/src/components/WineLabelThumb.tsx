import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../hooks/useApi'

type ThumbProps = {
  wineId: number
  enabled?: boolean
  alt?: string
  className?: string
  onOpen?: () => void
}

export function WineLabelThumb({
  wineId,
  enabled = true,
  alt = 'Etikett',
  className = '',
  onOpen,
}: ThumbProps) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setSrc(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wines/${wineId}/label-image`, {
          headers: authHeaders(),
        })
        if (!res.ok) return
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } catch {
        // no thumbnail
      }
    }
    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [wineId, enabled])

  if (!enabled || !src) {
    return (
      <div
        className={`entity-row__thumb entity-row__thumb--empty ${className}`.trim()}
        aria-hidden="true"
      />
    )
  }

  if (onOpen) {
    return (
      <button
        type="button"
        className="entity-row__thumb-btn"
        onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}
        aria-label={`Vis større bilde: ${alt}`}
      >
        <img className={`entity-row__thumb ${className}`.trim()} src={src} alt={alt} />
      </button>
    )
  }

  return <img className={`entity-row__thumb ${className}`.trim()} src={src} alt={alt} />
}

type LightboxProps = {
  wineId: number
  alt?: string
  open: boolean
  onClose: () => void
}

export function WineLabelLightbox({ wineId, alt = 'Etikett', open, onClose }: LightboxProps) {
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setSrc(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    setLoading(true)

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wines/${wineId}/label-image`, {
          headers: authHeaders(),
        })
        if (!res.ok) return
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [wineId, open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="label-lightbox" role="dialog" aria-modal="true" aria-label={alt}>
      <button type="button" className="label-lightbox__backdrop" aria-label="Lukk" onClick={onClose} />
      <div className="label-lightbox__panel">
        <div className="label-lightbox__toolbar">
          <span className="label-lightbox__title">{alt}</span>
          <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>
            Lukk
          </button>
        </div>
        <div className="label-lightbox__body">
          {loading && <p className="empty-state">Laster bilde…</p>}
          {!loading && src && <img src={src} alt={alt} className="label-lightbox__image" />}
          {!loading && !src && <p className="empty-state">Fant ikke bildet</p>}
        </div>
      </div>
    </div>
  )
}
