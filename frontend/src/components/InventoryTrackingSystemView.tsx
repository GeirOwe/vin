import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { useApi } from '../hooks/useApi'
import { InventoryLogEntry, InventoryRefreshCallback, QuantityUpdateCallback } from '../types/inventory'
import ConsumptionRecording from './ConsumptionRecording'
import InventoryUpdateControls from './InventoryUpdateControls'

interface InventoryTrackingSystemViewProps {
  wineId: number
  currentQuantity?: number
  onQuantityUpdate?: QuantityUpdateCallback
}

export default function InventoryTrackingSystemView({ 
  wineId, 
  currentQuantity = 0,
  onQuantityUpdate 
}: InventoryTrackingSystemViewProps) {
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLogEntry[]>([])
  const [currentWineQuantity, setCurrentWineQuantity] = useState(currentQuantity)
  const { loading, error, data, getJson } = useApi<InventoryLogEntry[]>()

  // Validate wineId prop
  if (!wineId || wineId <= 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-red-600">Invalid wine ID provided</p>
        </CardContent>
      </Card>
    )
  }

  // Fetch inventory log data
  useEffect(() => {
    fetchInventoryLogs()
  }, [wineId])

  // Update inventory logs when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      setInventoryLogs(data)
    }
  }, [data])

  // Update current quantity when prop changes (this should take precedence)
  useEffect(() => {
    setCurrentWineQuantity(currentQuantity)
  }, [currentQuantity])

  const fetchInventoryLogs = async () => {
    await getJson(`http://localhost:8000/api/wines/${wineId}/inventory-log`)
  }

  const handleQuantityUpdate: QuantityUpdateCallback = (newQuantity: number) => {
    setCurrentWineQuantity(newQuantity)
    // Refresh inventory logs to get the latest entry
    fetchInventoryLogs()
    // Call parent callback if provided
    onQuantityUpdate?.(newQuantity)
  }

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  const formatQuantityChange = (change: number): string => {
    if (change > 0) {
      return `+${change}`
    }
    return change.toString()
  }

  const getChangeTypeColor = (changeType: string): string => {
    switch (changeType.toLowerCase()) {
      case 'manual_adjustment':
        return 'text-blue-600 bg-blue-100'
      case 'purchase':
        return 'text-green-600 bg-green-100'
      case 'consumption':
        return 'text-red-600 bg-red-100'
      case 'loss':
        return 'text-orange-600 bg-orange-100'
      case 'transfer':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading inventory history...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-red-600 mb-2">Error loading inventory history</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchInventoryLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Quantity and Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <span className="text-sm font-medium text-gray-600">Available Bottles</span>
              <p className="text-2xl font-bold text-blue-600">{currentWineQuantity}</p>
            </div>
            <div className="ml-4">
              <InventoryUpdateControls
                wineId={wineId}
                currentQuantity={currentWineQuantity}
                onQuantityUpdate={handleQuantityUpdate}
              />
            </div>
          </div>
          
          {/* Consumption Recording Component */}
          <ConsumptionRecording
            wineId={wineId}
            currentQuantity={currentWineQuantity}
            onConsumptionSuccess={handleQuantityUpdate}
          />
        </CardContent>
      </Card>

      {/* Inventory History */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory History</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryLogs.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-gray-500">No inventory changes recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Change Type</TableHead>
                    <TableHead>Quantity Change</TableHead>
                    <TableHead>New Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(log.change_type)}`}>
                          {log.change_type.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className={`font-medium ${log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatQuantityChange(log.quantity_change)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.new_quantity}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {log.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
