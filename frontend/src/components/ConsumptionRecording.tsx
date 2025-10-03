import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useApi } from '../hooks/useApi'
import { WineConsumptionResponse, TastingNoteCreateRequest } from '../types/api'

interface ConsumptionRecordingProps {
  wineId: number
  currentQuantity: number
  onConsumptionSuccess?: (newQuantity: number) => void
}

export default function ConsumptionRecording({ 
  wineId, 
  currentQuantity,
  onConsumptionSuccess 
}: ConsumptionRecordingProps) {
  const [showTastingForm, setShowTastingForm] = useState(false)
  const [rating, setRating] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [showSuccess, setShowSuccess] = useState(false)
  
  const { loading, error, data, postJson } = useApi<WineConsumptionResponse>()

  const handleConsumeBottle = async (withTastingNotes = false) => {
    if (currentQuantity <= 0) {
      return // Should not happen as button should be disabled
    }

    let tastingRequest: TastingNoteCreateRequest | undefined
    
    if (withTastingNotes && (rating || notes.trim())) {
      tastingRequest = {
        rating: rating ? parseInt(rating) : undefined,
        notes: notes.trim() || undefined
      }
    }

    const result = await postJson(`http://localhost:8000/api/wines/${wineId}/consume`, tastingRequest || {})

    if (result) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      // Reset form
      setRating('')
      setNotes('')
      setShowTastingForm(false)
      
      // Notify parent of successful consumption
      onConsumptionSuccess?.(result.wine.quantity || 0)
    }
  }

  const handleQuickConsume = () => {
    handleConsumeBottle(false)
  }

  const handleConsumeWithNotes = () => {
    handleConsumeBottle(true)
  }

  const validateRating = (value: string): boolean => {
    if (!value) return true // Empty is valid (optional)
    const num = parseInt(value)
    return !isNaN(num) && num >= 1 && num <= 10
  }

  if (currentQuantity <= 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No bottles available to consume</p>
            <p className="text-sm text-gray-400">Current quantity: {currentQuantity}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Consume Wine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Quantity Display */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Available Bottles</p>
          <p className="text-2xl font-bold text-blue-600">{currentQuantity}</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-800 text-sm font-medium">✓ Bottle consumed successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800 text-sm font-medium">Error: {error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleQuickConsume}
            disabled={loading || currentQuantity <= 0}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Consuming...</span>
              </div>
            ) : (
              '🍷 Consume Bottle'
            )}
          </Button>

          <Button
            onClick={() => setShowTastingForm(!showTastingForm)}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {showTastingForm ? 'Hide' : 'Add'} Tasting Notes
          </Button>
        </div>

        {/* Tasting Notes Form */}
        {showTastingForm && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div>
              <Label htmlFor="rating">Rating (1-10)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="10"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Rate this wine (optional)"
                className={rating && !validateRating(rating) ? 'border-red-300' : ''}
              />
              {rating && !validateRating(rating) && (
                <p className="text-sm text-red-600 mt-1">Rating must be between 1 and 10</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Tasting Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share your tasting experience (optional)"
                rows={3}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <Button
              onClick={handleConsumeWithNotes}
              disabled={loading || currentQuantity <= 0 || (rating && !validateRating(rating))}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Recording...</span>
                </div>
              ) : (
                '🍷 Consume with Notes'
              )}
            </Button>
          </div>
        )}

        {/* Placeholder for AddTastingNotesForm */}
        <div className="text-center">
          <p className="text-xs text-gray-400">
            Future: Advanced tasting notes form will be integrated here
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
