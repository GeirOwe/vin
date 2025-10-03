// API type definitions for frontend-backend communication

// Wine Consumption API Types
export interface TastingNoteCreateRequest {
  rating?: number // 1-10 scale
  notes?: string
}

export interface TastingNoteResponse {
  id: number
  wine_id: number
  user_id: number
  rating?: number
  notes?: string
  timestamp: string // ISO datetime string
}

export interface InventoryLogResponse {
  id: number
  wine_id: number
  change_type: string
  quantity_change: number
  new_quantity: number
  notes?: string
  timestamp: string // ISO datetime string
}

export interface WineConsumptionResponse {
  wine: {
    id: number
    name: string
    type?: string
    producer?: string
    vintage?: number
    country?: string
    district?: string
    subdistrict?: string
    purchase_price?: number
    quantity?: number
    drink_after_date?: string
    drink_before_date?: string
    grape_composition: Array<{
      id: number
      grape_variety: string
      percentage: number
    }>
  }
  inventory_log: InventoryLogResponse
  tasting_note?: TastingNoteResponse
}

// Wine Quantity Update API Types
export interface WineQuantityUpdateRequest {
  quantity_change: number
  notes?: string
}
