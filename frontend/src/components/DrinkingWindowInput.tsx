import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { Input } from './ui/input'
import { Label } from './ui/label'
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
          <Label htmlFor="drink_after_date">Drikk etter</Label>
          <Input
            id="drink_after_date"
            type="date"
            value={drinkAfterDate}
            onChange={(e) => setDrinkAfterDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="drink_before_date">Drikk før</Label>
          <Input
            id="drink_before_date"
            type="date"
            value={drinkBeforeDate}
            onChange={(e) => setDrinkBeforeDate(e.target.value)}
          />
        </div>
      </div>

      <div className="section__head section__head--sub">
        <h2>Forslag</h2>
        <p>Hent et vindu fra type og årgang.</p>
      </div>
      <div>
        <div className="flex gap-2 items-end">
          <div className="grid gap-1 flex-1">
            <Label htmlFor="suggestion_wine_type">Vintype</Label>
            <select
              id="suggestion_wine_type"
              value={wineType}
              onChange={(e) => setWineType(e.target.value)}
              className="field-control w-full"
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
            <Label htmlFor="suggestion_vintage">Årgang</Label>
            <Input
              id="suggestion_vintage"
              type="number"
              placeholder="f.eks. 2020"
              value={vintage}
              onChange={(e) => setVintage(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={handleGetSuggestion}
            disabled={!wineType || !vintage || loadingSuggestion}
          >
            {loadingSuggestion ? 'Henter…' : 'Hent forslag'}
          </button>
        </div>
        {data && (
          <p className="text-sm mt-2" style={{ color: 'var(--ink-soft)' }}>
            Forslag: {data.drink_after_date} til {data.drink_before_date}
          </p>
        )}
      </div>
    </div>
  )
}
