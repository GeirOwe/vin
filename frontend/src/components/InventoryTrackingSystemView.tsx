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
    <div className="space-y-5">
      <div>
        <span className="wine-field__label">Nåværende beholdning</span>
        <div className="flex items-center gap-4 mt-1">
          <div className="wine-field__value" style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>
            {currentQuantity}
          </div>
          <InventoryUpdateControls wineId={wineId} currentQuantity={currentQuantity} onQuantityUpdated={handleQuantityUpdated} />
        </div>
      </div>

      <div>
        <span className="wine-field__label">Beholdningslogg</span>
        {loading && <div className="empty-state" style={{ paddingTop: '0.75rem' }}>Laster logg…</div>}
        {error && <div className="text-sm mt-2" style={{ color: 'var(--danger)' }}>Feil: {error}</div>}
        {!loading && !error && logs.length === 0 && (
          <p className="empty-state" style={{ paddingTop: '0.75rem' }}>Ingen loggoppføringer ennå.</p>
        )}
        {logs.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Når</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Endring</TableHead>
                  <TableHead>Nytt antall</TableHead>
                  <TableHead>Notater</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.timestamp).toLocaleString('nb-NO')}</TableCell>
                    <TableCell>{log.change_type}</TableCell>
                    <TableCell>{log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}</TableCell>
                    <TableCell>{log.new_quantity}</TableCell>
                    <TableCell>{log.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
