import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from './ui/button'
import { useApi } from '../hooks/useApi'

interface Props {
  wineId: number
  currentQuantity: number
  onQuantityUpdated?: (newQuantity: number) => void
}

export default function InventoryUpdateControls({ wineId, currentQuantity, onQuantityUpdated }: Props) {
  const [quantity, setQuantity] = useState<number>(currentQuantity)
  const [pendingQuantity, setPendingQuantity] = useState<number>(currentQuantity)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const { patchJson } = useApi<any>()

  useEffect(() => {
    setQuantity(currentQuantity)
    setPendingQuantity(currentQuantity)
  }, [currentQuantity])

  const canSave = useMemo(() => pendingQuantity !== quantity, [pendingQuantity, quantity])

  const submitChange = useCallback(async () => {
    if (!canSave) return
    setIsSaving(true)
    try {
      const quantity_change = pendingQuantity - quantity
      const result = await patchJson(`/api/wines/${wineId}/quantity`, {
        quantity_change,
        notes: undefined,
      })
      if (result && typeof result.quantity === 'number') {
        onQuantityUpdated?.(result.quantity)
      }
    } catch (e) {
      console.error('Failed to update quantity', e)
    } finally {
      setIsSaving(false)
    }
  }, [canSave, patchJson, pendingQuantity, quantity, wineId, onQuantityUpdated])

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => setPendingQuantity((q) => Math.max(0, q - 1))} disabled={isSaving}>-</Button>
      <input
        className="w-16 border rounded text-center"
        type="number"
        value={pendingQuantity}
        onChange={(e) => setPendingQuantity(Math.max(0, Number(e.target.value)))}
      />
      <Button onClick={() => setPendingQuantity((q) => q + 1)} disabled={isSaving}>+</Button>
      <Button onClick={submitChange} disabled={!canSave || isSaving} className="ml-2">{isSaving ? 'Saving...' : 'Save'}</Button>
    </div>
  )
}
