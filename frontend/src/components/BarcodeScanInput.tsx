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
  food_pairings?: Array<{ code: string; name: string }> | null
}

type Props = {
  onFound: (data: BarcodeLookupResult) => void
  disabled?: boolean
}

const SCAN_FORMATS = ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']

type DetectedBarcode = { rawValue?: string }
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>
}
type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike

function barcodeDetector(): BarcodeDetectorCtor | null {
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector
  return ctor ?? null
}

export function BarcodeScanInput({ onFound, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const lookupRef = useRef<(raw: string) => Promise<void>>(async () => {})
  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)

  const releaseCamera = () => {
    try {
      stopRef.current?.()
    } catch {
      // The camera is already stopped.
    }
    stopRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const stopCamera = () => {
    releaseCamera()
    setScanning(false)
    setStarting(false)
  }

  useEffect(() => () => releaseCamera(), [])

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Kunne ikke hente vinen'
      setError(message)
    } finally {
      setLoading(false)
    }
  }
  lookupRef.current = lookup

  const acceptCode = (text: string) => {
    const value = text.trim()
    if (!value) return
    stopCamera()
    setCode(value)
    void lookupRef.current(value)
  }

  const startCamera = async () => {
    setError(null)
    setNotes(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Denne nettleseren kan ikke åpne kameraet. Ta bilde av koden, eller skriv varenummeret.')
      return
    }
    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      })
      streamRef.current = stream
      setScanning(true)
    } catch {
      setError('Fikk ikke tilgang til kameraet. Ta bilde av koden, eller skriv varenummeret.')
    } finally {
      setStarting(false)
    }
  }

  useEffect(() => {
    if (!scanning) return
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return

    let stopped = false
    video.srcObject = stream
    void video.play().catch(() => {})

    const finish = (text: string) => {
      if (stopped) return
      stopped = true
      acceptCode(text)
    }

    let cancelDecode = () => {}
    const Detector = barcodeDetector()
    if (Detector) {
      const detector = new Detector({ formats: SCAN_FORMATS })
      const tick = async () => {
        if (stopped) return
        try {
          if (video.readyState >= 2) {
            const codes = await detector.detect(video)
            const raw = codes.find((item) => item.rawValue)?.rawValue
            if (raw) {
              finish(raw)
              return
            }
          }
        } catch {
          // Keep looking. A single frame often has no code.
        }
        if (!stopped) window.setTimeout(tick, 200)
      }
      void tick()
      cancelDecode = () => {
        stopped = true
      }
    } else {
      void (async () => {
        try {
          const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
            import('@zxing/browser'),
            import('@zxing/library'),
          ])
          if (stopped) return
          const hints = new Map()
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
          ])
          hints.set(DecodeHintType.TRY_HARDER, true)
          const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 200 })
          const controls = await reader.decodeFromStream(stream, video, (result) => {
            if (result) finish(result.getText())
          })
          if (stopped) controls.stop()
          else cancelDecode = () => controls.stop()
        } catch {
          if (stopped) return
          setError('Klarte ikke å lese kameraet. Ta bilde av koden, eller skriv varenummeret.')
          stopCamera()
        }
      })()
    }

    stopRef.current = () => {
      stopped = true
      cancelDecode()
    }

    return () => {
      stopped = true
      cancelDecode()
    }
  }, [scanning])

  const onPhoto = async (file: File | null) => {
    if (!file) return
    setError(null)
    setNotes(null)
    setLoading(true)
    try {
      const text = await readCodeFromImage(file)
      setCode(text)
      await lookup(text)
    } catch {
      setError('Fant ingen kode i bildet. Hold nærmere, eller skriv varenummeret.')
      setLoading(false)
    }
  }

  const busy = disabled || loading || scanning || starting

  return (
    <div className="band space-y-3">
      <div>
        <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Skann kode</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
          Skann QR-koden eller strekkoden, eller ta et bilde av den. Du kan også skrive varenummeret.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void startCamera()} className="btn btn--primary btn--small">
          {starting ? 'Åpner kamera…' : 'Skann kode'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => photoRef.current?.click()}
          className="btn btn--ghost btn--small"
        >
          Ta bilde av koden
        </button>
        {scanning && (
          <button type="button" onClick={stopCamera} className="btn btn--ghost btn--small">
            Stopp
          </button>
        )}
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          e.target.value = ''
          void onPhoto(file)
        }}
      />

      {scanning && (
        <div className="max-w-sm space-y-2">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            aria-label="Kamerabilde for skanning"
            className="w-full object-contain"
            style={{ height: '240px', border: '1px solid var(--line)', borderRadius: '2px', background: 'var(--surface)' }}
          />
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>Hold koden i bildet.</p>
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

async function readCodeFromImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const Detector = barcodeDetector()
    if (Detector) {
      const codes = await new Detector({ formats: SCAN_FORMATS }).detect(bitmap)
      const raw = codes.find((item) => item.rawValue)?.rawValue
      if (raw) return raw
    }
  } finally {
    bitmap.close()
  }

  const url = URL.createObjectURL(file)
  try {
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import('@zxing/browser'),
      import('@zxing/library'),
    ])
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    const result = await new BrowserMultiFormatReader(hints).decodeFromImageUrl(url)
    return result.getText()
  } finally {
    URL.revokeObjectURL(url)
  }
}
