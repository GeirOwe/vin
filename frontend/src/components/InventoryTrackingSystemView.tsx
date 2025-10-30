import { useCallback, useEffect, useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import InventoryUpdateControls from './InventoryUpdateControls'
import { useApi } from '../hooks/useApi'
import { InventoryLogEntry } from '../types/inventory'

interface Props {
  wineId: number
  initialQuantity: number
  onQuantityUpdate?: (newQuantity: number) => void
}

export default function InventoryTrackingSystemView({ wineId, initialQuantity, onQuantityUpdate }: Props) {
  const { loading, error, data, getJson } = useApi<InventoryLogEntry[]>()
  const [currentQuantity, setCurrentQuantity] = useState<number>(initialQuantity)

  const refreshLogs = useCallback(async () => {
    await getJson(`/api/wines/${wineId}/inventory-log`)
  }, [getJson, wineId])

  useEffect(() => {
    setCurrentQuantity(initialQuantity)
  }, [initialQuantity])

  useEffect(() => {
    refreshLogs()
  }, [refreshLogs])

  const logs = useMemo(() => data || [], [data])

  const handleQuantityUpdated = (newQuantity: number) => {
    setCurrentQuantity(newQuantity)
    onQuantityUpdate?.(newQuantity)
    refreshLogs()
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm text-gray-600 mb-1">Current Inventory</div>
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold">{currentQuantity}</div>
          <InventoryUpdateControls wineId={wineId} currentQuantity={currentQuantity} onQuantityUpdated={handleQuantityUpdated} />
        </div>
      </div>

      <div>
        <div className="text-sm text-gray-600 mb-2">Inventory Change Log</div>
        {loading && <div>Loading log...</div>}
        {error && <div className="text-red-600">Error: {error}</div>}
        {!loading && !error && logs.length === 0 && <div>No log entries yet.</div>}
        {logs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>New Qty</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{log.change_type}</TableCell>
                  <TableCell>{log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}</TableCell>
                  <TableCell>{log.new_quantity}</TableCell>
                  <TableCell>{log.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
