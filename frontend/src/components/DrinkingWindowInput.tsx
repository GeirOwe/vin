import { useEffect, useState } from 'react'
import { useApi } from '../hooks/useApi'

interface Props {
  onChange: (v: { drink_after_date?: string; drink_before_date?: string }) => void
}

export default function DrinkingWindowInput({ onChange }: Props) {
  const [wineType, setWineType] = useState('Red')
  const [vintage, setVintage] = useState<number | ''>('')
  const { getJson, data } = useApi<{ drink_after_date: string; drink_before_date: string }>()

  useEffect(() => {
    if (!wineType || !vintage) return
    const url = `/api/wines/drinking-window-suggestions?wine_type=${encodeURIComponent(wineType)}&vintage=${encodeURIComponent(String(vintage))}`
    getJson(url)
  }, [wineType, vintage, getJson])

  useEffect(() => {
    if (data) {
      onChange({
        drink_after_date: data.drink_after_date,
        drink_before_date: data.drink_before_date,
      })
    }
  }, [data, onChange])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select value={wineType} onChange={(e) => setWineType(e.target.value)} className="border rounded px-2 py-1">
          <option>Red</option>
          <option>White</option>
          <option>Rose</option>
          <option>Sparkling</option>
          <option>Dessert</option>
          <option>Fortified</option>
        </select>
        <input
          type="number"
          className="border rounded px-2 py-1"
          placeholder="Vintage"
          value={vintage}
          onChange={(e) => setVintage(e.target.value ? Number(e.target.value) : '')}
        />
      </div>
      {data && (
        <div className="text-sm text-gray-600">
          Suggested window: {data.drink_after_date} → {data.drink_before_date}
        </div>
      )}
    </div>
  )
}
