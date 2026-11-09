import { useEffect, useRef, useState } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { API_BASE, authHeaders, errorMessage } from '../hooks/useApi'

export type BarcodeLookupResult = {
  name?: string | null
  type?: string | null
  producer?: string | null
  vintage?: number | null
  country?: string | null
  district?: string | null
  subdistrict?: string | null
  grape_composition?: Array<{ grape_variety: string; percentage?: number | null }> | null
  purchase_price?: number | null
  varenummer?: string | null
  notes?: string | null
}

type Props = {
  onFound: (data: BarcodeLookupResult) => void
  disabled?: boolean
}

export function BarcodeScanInput({ onFound, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)

  const stopCamera = () => {
    try {
      stopRef.current?.()
    } catch {
      // The camera is already stopped.
    }
    stopRef.current = null
    setScanning(false)
  }

  useEffect(() => () => stopRef.current?.(), [])

  const lookup = async (raw: string) => {
    const value = raw.trim()
    if (!value) {
      setError('Lim inn eller skann en kode.')
      return
    }
    setLoading(true)
    setError(null)
    setNotes(null)
    try {
      const res = await fetch(`${API_BASE}/api/wines/lookup-barcode`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ code: value }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorMessage(data, res.status))
      onFound(data as BarcodeLookupResult)
      setNotes(data?.notes ? String(data.notes) : null)
      if (data?.varenummer) setCode(String(data.varenummer))
    } catch (err: any) {
      setError(err?.message || 'Kunne ikke hente vinen')
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    setError(null)
    setScanning(true)
  }

  useEffect(() => {
    if (!scanning) return
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    let handled = false

    const run = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled) return
        const reader = new BrowserMultiFormatReader()
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          video,
          (result) => {
            if (!result || handled || cancelled) return
            handled = true
            const text = result.getText()
            controls.stop()
            stopRef.current = null
            setScanning(false)
            setCode(text)
            void lookup(text)
          },
        )
        if (cancelled) {
          controls.stop()
          return
        }
        stopRef.current = () => controls.stop()
      } catch (err: any) {
        if (cancelled) return
        setScanning(false)
        setError(err?.message || 'Fikk ikke tilgang til kameraet. Lim inn koden i feltet under.')
      }
    }
    void run()

    return () => {
      cancelled = true
      stopRef.current?.()
      stopRef.current = null
    }
  }, [scanning])

  return (
    <div className="band space-y-3">
      <div>
        <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Skann kode</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
          Skann QR-koden eller strekkoden på flasken. Vinmonopolet fyller ut skjemaet.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || loading || scanning}
          onClick={startCamera}
          className="btn btn--primary btn--small"
        >
          Skann kode
        </button>
        {scanning && (
          <button type="button" onClick={stopCamera} className="btn btn--ghost btn--small">
            Stopp
          </button>
        )}
      </div>

      {scanning && (
        <div className="max-w-sm">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            aria-label="Kamerabilde for skanning"
            className="max-h-64 w-full object-contain"
            style={{ border: '1px solid var(--line)', borderRadius: '2px', background: 'var(--surface)' }}
          />
        </div>
      )}

      <div className="grid gap-1 max-w-sm">
        <Label htmlFor="vinmonopolet-kode">Kode på flasken</Label>
        <Input
          id="vinmonopolet-kode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void lookup(code)
            }
          }}
          placeholder="EAN, QR-lenke eller varenummer"
          disabled={disabled || loading}
          autoComplete="off"
        />
      </div>
      <button
        type="button"
        disabled={disabled || loading || !code.trim()}
        onClick={() => void lookup(code)}
        className="btn btn--ghost btn--small"
      >
        {loading ? 'Henter…' : 'Hent fra Vinmonopolet'}
      </button>

      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
      {notes && !error && <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{notes}</div>}
    </div>
  )
}
