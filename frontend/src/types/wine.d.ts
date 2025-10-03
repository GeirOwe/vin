// Wine type definitions for the frontend application

export interface Grape {
  id: number
  grape_variety: string
  percentage: number
}

export interface Wine {
  id: number
  name: string
  type?: string | null
  producer?: string | null
  vintage?: number | null
  country?: string | null
  district?: string | null
  subdistrict?: string | null
  purchase_price?: number | null
  quantity?: number | null
  drink_after_date?: string | null
  drink_before_date?: string | null
  grape_composition: Grape[]
}

export type WineType = 'Red' | 'White' | 'Rose' | 'Sparkling' | 'Dessert' | 'Fortified'

export type DrinkingWindowStatus = 'ready_to_drink' | 'approaching_deadline' | 'not_ready'
