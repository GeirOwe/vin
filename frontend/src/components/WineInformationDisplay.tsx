import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Wine } from '../types/wine'
import { useApi } from '../hooks/useApi'
import InventoryTrackingSystemView from './InventoryTrackingSystemView'

interface WineInformationDisplayProps {
  wine: Wine
  onQuantityUpdate?: (newQuantity: number) => void
  onWineUpdate?: () => void
  showInventoryTracking?: boolean
}

export default function WineInformationDisplay({ wine, onQuantityUpdate, onWineUpdate, showInventoryTracking = false }: WineInformationDisplayProps) {
  const [isEditingDrinkingWindow, setIsEditingDrinkingWindow] = useState(false)
  const [drinkAfterDate, setDrinkAfterDate] = useState(wine.drink_after_date || '')
  const [drinkBeforeDate, setDrinkBeforeDate] = useState(wine.drink_before_date || '')
  const [isSaving, setIsSaving] = useState(false)
  
  const { patchJson } = useApi()

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return '—'
    return `$${price.toFixed(2)}`
  }

  const handleSaveDrinkingWindow = async () => {
    setIsSaving(true)
    try {
      const updateData: any = {}
      if (drinkAfterDate) updateData.drink_after_date = drinkAfterDate
      if (drinkBeforeDate) updateData.drink_before_date = drinkBeforeDate
      
      await patchJson(`http://localhost:8000/api/wines/${wine.id}`, updateData)
      setIsEditingDrinkingWindow(false)
      // Refresh the wine data in the parent component
      onWineUpdate?.()
    } catch (error) {
      console.error('Failed to update drinking window:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setDrinkAfterDate(wine.drink_after_date || '')
    setDrinkBeforeDate(wine.drink_before_date || '')
    setIsEditingDrinkingWindow(false)
  }

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return date
    }
  }

  const formatDrinkingWindow = (afterDate?: string | null, beforeDate?: string | null): string => {
    const after = formatDate(afterDate)
    const before = formatDate(beforeDate)
    
    if (after === '—' && before === '—') return '—'
    if (after === '—') return `Before ${before}`
    if (before === '—') return `After ${after}`
    return `${after} to ${before}`
  }

  return (
    <div className="space-y-4">
      {/* Core Wine Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">{wine.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Producer</span>
              <p className="text-base">{wine.producer || '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Type</span>
              <p className="text-base">{wine.type || '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Vintage</span>
              <p className="text-base">{wine.vintage || '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Quantity</span>
              <p className="text-base">{wine.quantity || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic Origin */}
      {(wine.country || wine.district || wine.subdistrict) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Origin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Country</span>
              <p className="text-base">{wine.country || '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">District</span>
              <p className="text-base">{wine.district || '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Subdistrict</span>
              <p className="text-base">{wine.subdistrict || '—'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      {wine.purchase_price && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <span className="text-sm font-medium text-gray-600">Purchase Price</span>
              <p className="text-lg font-semibold text-green-600">{formatPrice(wine.purchase_price)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drinking Window */}
      {(wine.drink_after_date || wine.drink_before_date || isEditingDrinkingWindow) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Drinking Window</CardTitle>
              {!isEditingDrinkingWindow && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingDrinkingWindow(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingDrinkingWindow ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Drink After Date
                  </label>
                  <Input
                    type="date"
                    value={drinkAfterDate}
                    onChange={(e) => setDrinkAfterDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Drink Before Date
                  </label>
                  <Input
                    type="date"
                    value={drinkBeforeDate}
                    onChange={(e) => setDrinkBeforeDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveDrinkingWindow}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-600">Recommended Period</span>
                  <p className="text-base">{formatDrinkingWindow(wine.drink_after_date, wine.drink_before_date)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Grape Composition */}
      {wine.grape_composition && wine.grape_composition.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grape Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {wine.grape_composition.map((grape) => (
                <div key={grape.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="font-medium">{grape.grape_variety}</span>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                    {grape.percentage}%
                  </span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {wine.grape_composition.reduce((sum, grape) => sum + grape.percentage, 0)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Tracking System */}
      {showInventoryTracking && (
        <InventoryTrackingSystemView
          wineId={wine.id}
          currentQuantity={wine.quantity || 0}
          onQuantityUpdate={onQuantityUpdate}
        />
      )}
    </div>
  )
}
