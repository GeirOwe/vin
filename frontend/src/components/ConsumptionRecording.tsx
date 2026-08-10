import { useState } from 'react'
import { Button } from './ui/button'
import { useApi } from '../hooks/useApi'
import { TastingNoteCreateRequest } from '../types/api'

interface Props {
  wineId: number
  currentQuantity: number
  onDrikkd?: (newQuantity: number) => void
}

export default function ConsumptionRecording({ wineId, currentQuantity, onDrikkd }: Props) {
  const { postJson, loading, error } = useApi<any>()
  const [showNotater, setShowNotater] = useState(false)
  const [rating, setVurdering] = useState<number | undefined>(undefined)
  const [notes, setNotater] = useState<string>('')

  const submit = async () => {
    const tastingRequest: TastingNoteCreateRequest | undefined = showNotater
      ? { rating, notes: notes || undefined }
      : undefined

    const result = await postJson(`/api/wines/${wineId}/consume`, tastingRequest || {})
    if (result && result.wine && typeof result.wine.quantity === 'number') {
      onDrikkd?.(result.wine.quantity)
      setShowNotater(false)
      setVurdering(undefined)
      setNotater('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div>Current quantity: <span className="font-semibold">{currentQuantity}</span></div>
        <Button disabled={loading} onClick={submit}>{loading ? 'Saving...' : 'Drikk flaske'}</Button>
      </div>
      <div>
        <button className="text-sm underline" onClick={() => setShowNotater((s) => !s)}>
          {showNotater ? 'Hide tasting notes' : 'Add tasting notes'}
        </button>
      </div>
      {showNotater && (
        <div className="space-y-2">
          <div>
            <label className="block text-sm">Vurdering (1-10)</label>
            <input type="number" min={1} max={10} value={rating ?? ''} onChange={(e) => setVurdering(Number(e.target.value))} className="border rounded px-2 py-1 w-24" />
          </div>
          <div>
            <label className="block text-sm">Notater</label>
            <textarea value={notes} onChange={(e) => setNotater(e.target.value)} className="border rounded px-2 py-1 w-full" rows={3} />
          </div>
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  )
}
