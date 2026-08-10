import { useRef, useState } from 'react'
import { API_BASE, authHeaders, errorMessage } from '../hooks/useApi'

type LabelExtractionResult = {
  name?: string | null
  type?: string | null
  producer?: string | null
  vintage?: number | null
  country?: string | null
  district?: string | null
  subdistrict?: string | null
  grape_composition?: Array<{ grape_variety: string; percentage?: number | null }> | null
  notes?: string | null
}

type Props = {
  onExtracted: (data: LabelExtractionResult) => void
  onImageChange?: (image: Blob | null) => void
  disabled?: boolean
}

async function compressImage(file: File, maxEdge = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Kunne ikke behandle bildet')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Kunne ikke komprimere bildet')
  return blob
}

export function LabelScanInput({ onExtracted, onImageChange, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)

  const onFileChosen = async (file: File | null) => {
    setError(null)
    setNotes(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      onImageChange?.(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Velg en bildefil')
      onImageChange?.(null)
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    try {
      const compressed = await compressImage(file)
      onImageChange?.(compressed)
    } catch (err: any) {
      setError(err?.message || 'Kunne ikke lese bildet')
      onImageChange?.(null)
    }
  }

  const analyze = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    setNotes(null)
    try {
      const compressed = await compressImage(selectedFile)
      onImageChange?.(compressed)
      const formData = new FormData()
      formData.append('image', compressed, 'label.jpg')

      const res = await fetch(`${API_BASE}/api/wines/extract-from-label`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(errorMessage(data, res.status))
      }
      onExtracted(data as LabelExtractionResult)
      if (data?.notes) setNotes(data.notes)
    } catch (err: any) {
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel space-y-3">
      <div>
        <h2 className="page-title" style={{ fontSize: '1.5rem' }}>Skann etikett</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-soft)' }}>
          Ta bilde eller last opp etikettsbilde. Bildet lagres med vinen, og Grok kan fylle ut skjemaet.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => cameraRef.current?.click()}
          className="btn btn--ghost btn--small"
        >
          Ta bilde
        </button>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => fileRef.current?.click()}
          className="btn btn--ghost btn--small"
        >
          Last opp bilde
        </button>
        <button
          type="button"
          disabled={disabled || loading || !selectedFile}
          onClick={analyze}
          className="btn btn--primary btn--small"
        >
          {loading ? 'Leser etikett…' : 'Fyll skjema fra etikett'}
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
      />

      {previewUrl && (
        <div className="max-w-sm">
          <img src={previewUrl} alt="Forhåndsvisning av vinetikett" className="rounded border max-h-64 object-contain bg-white" />
        </div>
      )}

      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
      {notes && !error && <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>Merk: {notes}</div>}
    </div>
  )
}

export type { LabelExtractionResult }
