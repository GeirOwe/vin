import { useCallback, useEffect, useMemo, useState } from 'react'
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
      <button type="button" className="btn btn--ghost btn--small" onClick={() => setPendingQuantity((q) => Math.max(0, q - 1))} disabled={isSaving}>-</button>
      <input
        className="field-control w-16 text-center"
        type="number"
        value={pendingQuantity}
        onChange={(e) => setPendingQuantity(Math.max(0, Number(e.target.value)))}
      />
      <button type="button" className="btn btn--ghost btn--small" onClick={() => setPendingQuantity((q) => q + 1)} disabled={isSaving}>+</button>
      <button type="button" className="btn btn--primary btn--small" onClick={submitChange} disabled={!canSave || isSaving}>{isSaving ? 'Lagrer…' : 'Lagre'}</button>
    </div>
  )
}
