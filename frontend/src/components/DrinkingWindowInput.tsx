import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'

interface Props {
  onChange: (v: { drink_after_date?: string; drink_before_date?: string }) => void
  value?: { drink_after_date?: string; drink_before_date?: string }
}

export default function DrinkingWindowInput({ onChange, value }: Props) {
  const [drinkAfterDate, setDrinkAfterDate] = useState(value?.drink_after_date || '')
  const [drinkBeforeDate, setDrinkBeforeDate] = useState(value?.drink_before_date || '')
  const [wineType, setWineType] = useState('Red')
  const [vintage, setVintage] = useState<number | ''>('')
  const { getJson, data, loading: loadingSuggestion } = useApi<{ drink_after_date: string; drink_before_date: string }>()

  // Update form when dates change manually
  useEffect(() => {
    onChange({
      drink_after_date: drinkAfterDate || undefined,
      drink_before_date: drinkBeforeDate || undefined,
    })
  }, [drinkAfterDate, drinkBeforeDate, onChange])

  // Update dates when API suggestion is received
  useEffect(() => {
    if (data) {
      setDrinkAfterDate(data.drink_after_date)
      setDrinkBeforeDate(data.drink_before_date)
    }
  }, [data])

  const handleGetSuggestion = () => {
    if (!wineType || !vintage) return
    const url = `/api/wines/drinking-window-suggestions?wine_type=${encodeURIComponent(wineType)}&vintage=${encodeURIComponent(String(vintage))}`
    getJson(url)
  }

  return (
    <div className="space-y-4">
      {/* Manual date inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-1">
          <Label htmlFor="drink_after_date">Drink After Date</Label>
          <Input
            id="drink_after_date"
            type="date"
            value={drinkAfterDate}
            onChange={(e) => setDrinkAfterDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="drink_before_date">Drink Before Date</Label>
          <Input
            id="drink_before_date"
            type="date"
            value={drinkBeforeDate}
            onChange={(e) => setDrinkBeforeDate(e.target.value)}
          />
        </div>
      </div>

      {/* Optional: Get suggestion from API */}
      <div className="border-t pt-4">
        <div className="text-sm font-medium text-gray-600 mb-2">Or get suggestion based on wine type and vintage:</div>
        <div className="flex gap-2 items-end">
          <div className="grid gap-1 flex-1">
            <Label htmlFor="suggestion_wine_type">Wine Type</Label>
            <select
              id="suggestion_wine_type"
              value={wineType}
              onChange={(e) => setWineType(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option>Red</option>
              <option>White</option>
              <option>Rose</option>
              <option>Sparkling</option>
              <option>Dessert</option>
              <option>Fortified</option>
            </select>
          </div>
          <div className="grid gap-1 flex-1">
            <Label htmlFor="suggestion_vintage">Vintage</Label>
            <Input
              id="suggestion_vintage"
              type="number"
              placeholder="e.g., 2020"
              value={vintage}
              onChange={(e) => setVintage(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <Button
            type="button"
            onClick={handleGetSuggestion}
            disabled={!wineType || !vintage || loadingSuggestion}
            variant="outline"
          >
            {loadingSuggestion ? 'Loading...' : 'Get Suggestion'}
          </Button>
        </div>
        {data && (
          <div className="text-sm text-green-600 mt-2">
            Suggested window: {data.drink_after_date} → {data.drink_before_date}
          </div>
        )}
      </div>
    </div>
  )
}
