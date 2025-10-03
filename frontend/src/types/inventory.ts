// Inventory tracking type definitions for the frontend application

export interface InventoryLogEntry {
  id: number
  wine_id: number
  change_type: string
  quantity_change: number
  new_quantity: number
  notes?: string | null
  timestamp: string // ISO datetime string from API
}

export interface WineQuantity {
  current: number
  wine_id: number
}

export type ChangeType = 'manual_adjustment' | 'purchase' | 'consumption' | 'loss' | 'transfer'

export interface QuantityUpdateCallback {
  (newQuantity: number): void
}

export interface InventoryRefreshCallback {
  (): void
}
