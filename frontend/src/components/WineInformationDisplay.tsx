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
      
      await patchJson(`/api/wines/${wine.id}`, updateData)
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
        year: 'numeric', month: 'short', day: 'numeric'
      })
    } catch {
      return String(date)
    }
  }

  const formatDrinkingWindow = (after?: string | null, before?: string | null): string => {
    if (!after && !before) return '—'
    const afterStr = formatDate(after || undefined)
    const beforeStr = formatDate(before || undefined)
    return `${afterStr} → ${beforeStr}`
  }

  return (
    <div className="space-y-4">
      {/* Core Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Core Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Name</span>
              <p className="text-lg font-semibold">{wine.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Producer</span>
              <p className="text-lg">{wine.producer || '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Vintage</span>
              <p className="text-lg">{wine.vintage ?? '—'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Type</span>
              <p className="text-lg">{wine.type || '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Geographic */}
      {(wine.country || wine.district || wine.subdistrict) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geographic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Country</span>
                <p className="text-lg">{wine.country || '—'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">District</span>
                <p className="text-lg">{wine.district || '—'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Subdistrict</span>
                <p className="text-lg">{wine.subdistrict || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      {(wine.purchase_price !== undefined || wine.quantity !== undefined) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Purchase Price</span>
                <p className="text-lg font-semibold text-green-600">{formatPrice(wine.purchase_price)}</p>
              </div>
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
            <div className="space-y-2">
              {wine.grape_composition.map((gc) => (
                <div key={gc.id} className="flex items-center justify-between">
                  <span>{gc.grape_variety}</span>
                  <span className="text-gray-600">{gc.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showInventoryTracking && (
        <InventoryTrackingSystemView wineId={wine.id} initialQuantity={wine.quantity ?? 0} onQuantityUpdate={onQuantityUpdate} />
      )}
    </div>
  )
}
