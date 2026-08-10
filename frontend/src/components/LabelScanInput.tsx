import { useRef, useState } from 'react'

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
  disabled?: boolean
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function compressImage(file: File, maxEdge = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process image')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Could not compress image')
  return blob
}

export function LabelScanInput({ onExtracted, disabled }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)

  const onFileChosen = (file: File | null) => {
    setError(null)
    setNotes(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const analyze = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    setNotes(null)
    try {
      const compressed = await compressImage(selectedFile)
      const formData = new FormData()
      formData.append('image', compressed, 'label.jpg')

      const res = await fetch(`${API_BASE}/api/wines/extract-from-label`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message =
          (data && (typeof data.detail === 'string' ? data.detail : data.message)) ||
          `Request failed (${res.status})`
        throw new Error(message)
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
    <div className="space-y-3 rounded-lg border border-dashed border-stone-300 bg-stone-50/80 p-4">
      <div>
        <h2 className="text-xl font-semibold">Scan label</h2>
        <p className="text-sm text-stone-600 mt-1">
          Take a photo or upload a label image. Grok will suggest values for the form below — review before saving.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => cameraRef.current?.click()}
          className="border rounded px-3 py-2 bg-white hover:bg-stone-100 disabled:opacity-50"
        >
          Take photo
        </button>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => fileRef.current?.click()}
          className="border rounded px-3 py-2 bg-white hover:bg-stone-100 disabled:opacity-50"
        >
          Upload image
        </button>
        <button
          type="button"
          disabled={disabled || loading || !selectedFile}
          onClick={analyze}
          className="border rounded px-3 py-2 bg-stone-800 text-white hover:bg-stone-900 disabled:bg-gray-400"
        >
          {loading ? 'Reading label…' : 'Fill form from label'}
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
          <img src={previewUrl} alt="Selected wine label preview" className="rounded border max-h-64 object-contain bg-white" />
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}
      {notes && !error && <div className="text-sm text-stone-600">Note: {notes}</div>}
    </div>
  )
}

export type { LabelExtractionResult }
