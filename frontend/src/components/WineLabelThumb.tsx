import { useEffect, useState } from 'react'
import { API_BASE, authHeaders } from '../hooks/useApi'

type Props = {
  wineId: number
  enabled?: boolean
  alt?: string
}

export function WineLabelThumb({ wineId, enabled = true, alt = 'Etikett' }: Props) {
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
    return <div className="entity-row__thumb entity-row__thumb--empty" aria-hidden="true" />
  }

  return <img className="entity-row__thumb" src={src} alt={alt} />
}
