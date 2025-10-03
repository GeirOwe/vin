import { useEffect, useState } from 'react'

export default function WineList() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('http://localhost:8000/api/wines')
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.detail || `Failed (${res.status})`)
        if (mounted) setItems(data)
      })
      .catch(err => mounted && setError(err.message || String(err)))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-4">Loading…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  if (items.length === 0) return <div className="p-4 text-gray-600">No wines yet.</div>

  return (
    <div className="divide-y">
      {items.map(w => (
        <div key={w.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{w.name}</div>
            <div className="text-sm text-gray-600">{w.type || '—'} · {w.producer || '—'} · {w.vintage || '—'}</div>
          </div>
          <div className="text-sm text-gray-700 mt-1">
            {w.country || '—'}{w.district ? `, ${w.district}` : ''}{w.subdistrict ? `, ${w.subdistrict}` : ''}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            Price: {w.purchase_price != null ? `$${w.purchase_price.toFixed(2)}` : '—'} · Qty: {w.quantity ?? '—'}
          </div>
          {w.drink_after_date || w.drink_before_date ? (
            <div className="text-sm text-gray-700 mt-1">
              Window: {w.drink_after_date || '—'} → {w.drink_before_date || '—'}
            </div>
          ) : null}
          {w.grape_composition?.length ? (
            <div className="text-sm text-gray-700 mt-2">
              Grapes: {w.grape_composition.map((g: any) => `${g.grape_variety} ${g.percentage}%`).join(', ')}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
