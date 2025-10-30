import { useState } from 'react'
import { Button } from './ui/button'
import { useApi } from '../hooks/useApi'
import { TastingNoteCreateRequest } from '../types/api'

interface Props {
  wineId: number
  currentQuantity: number
  onConsumed?: (newQuantity: number) => void
}

export default function ConsumptionRecording({ wineId, currentQuantity, onConsumed }: Props) {
  const { postJson, loading, error } = useApi<any>()
  const [showNotes, setShowNotes] = useState(false)
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState<string>('')

  const submit = async () => {
    const tastingRequest: TastingNoteCreateRequest | undefined = showNotes
      ? { rating, notes: notes || undefined }
      : undefined

    const result = await postJson(`/api/wines/${wineId}/consume`, tastingRequest || {})
    if (result && result.wine && typeof result.wine.quantity === 'number') {
      onConsumed?.(result.wine.quantity)
      setShowNotes(false)
      setRating(undefined)
      setNotes('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div>Current quantity: <span className="font-semibold">{currentQuantity}</span></div>
        <Button disabled={loading} onClick={submit}>{loading ? 'Saving...' : 'Consume Bottle'}</Button>
      </div>
      <div>
        <button className="text-sm underline" onClick={() => setShowNotes((s) => !s)}>
          {showNotes ? 'Hide tasting notes' : 'Add tasting notes'}
        </button>
      </div>
      {showNotes && (
        <div className="space-y-2">
          <div>
            <label className="block text-sm">Rating (1-10)</label>
            <input type="number" min={1} max={10} value={rating ?? ''} onChange={(e) => setRating(Number(e.target.value))} className="border rounded px-2 py-1 w-24" />
          </div>
          <div>
            <label className="block text-sm">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border rounded px-2 py-1 w-full" rows={3} />
          </div>
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  )
}
