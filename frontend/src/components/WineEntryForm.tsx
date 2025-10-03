import { FormEvent, useMemo, useState } from 'react'
import { WineDetails, WineDetailsInput } from './WineDetailsInput'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { PricingQuantityInput, PricingQuantity } from './PricingQuantityInput'

export type GrapeRow = { grape_variety: string; percentage: number | '' }

export default function WineEntryForm() {
  const [details, setDetails] = useState<WineDetails | null>(null)
  const [pq, setPq] = useState<PricingQuantity>({})
  const [drinkAfter, setDrinkAfter] = useState<string>('')
  const [drinkBefore, setDrinkBefore] = useState<string>('')
  const [grapes, setGrapes] = useState<GrapeRow[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const grapesTotal = useMemo(() => {
    return grapes.reduce((sum, g) => sum + (typeof g.percentage === 'number' ? g.percentage : 0), 0)
  }, [grapes])

  const canSubmit = useMemo(() => {
    if (!details) return false
    if (grapes.length > 0 && Math.abs(grapesTotal - 100) > 0.5) return false
    return true
  }, [details, grapes.length, grapesTotal])

  const addGrape = () => setGrapes(g => [...g, { grape_variety: '', percentage: '' }])
  const removeGrape = (idx: number) => setGrapes(g => g.filter((_, i) => i !== idx))
  const updateGrape = (idx: number, patch: Partial<GrapeRow>) => setGrapes(g => g.map((row, i) => i === idx ? { ...row, ...patch } : row))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    setError(null)
    try {
      if (!details) throw new Error('Please complete required fields above')
      const payload: any = {
        ...details,
        purchase_price: pq.purchase_price ?? undefined,
        quantity: pq.quantity ?? undefined,
        drink_after_date: drinkAfter || undefined,
        drink_before_date: drinkBefore || undefined,
        grape_composition: grapes.length ? grapes.map(g => ({ grape_variety: g.grape_variety.trim(), percentage: typeof g.percentage === 'number' ? g.percentage : 0 })) : undefined,
      }
      const res = await fetch('http://localhost:8000/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || 'Failed to create wine')
      setResult(data)
    } catch (err: any) {
      setError(err.message || String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Wine Details</h2>
        <WineDetailsInput onChange={setDetails} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Pricing & Stock</h2>
        <PricingQuantityInput onChange={setPq} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Drinking Window</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-1">
            <Label htmlFor="drink_after">Drink After</Label>
            <Input id="drink_after" type="date" value={drinkAfter} onChange={e => setDrinkAfter(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="drink_before">Drink Before</Label>
            <Input id="drink_before" type="date" value={drinkBefore} onChange={e => setDrinkBefore(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Grape Composition</h2>
          <button type="button" onClick={addGrape} className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50">Add grape</button>
        </div>
        <div className="grid gap-3">
          {grapes.map((g, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-7 grid gap-1">
                <Label htmlFor={`grape_${idx}`}>Variety</Label>
                <Input id={`grape_${idx}`} placeholder="e.g., Cabernet Sauvignon" value={g.grape_variety} onChange={e => updateGrape(idx, { grape_variety: e.target.value })} />
              </div>
              <div className="md:col-span-3 grid gap-1">
                <Label htmlFor={`pct_${idx}`}>Percentage</Label>
                <Input id={`pct_${idx}`} placeholder="e.g., 60" value={g.percentage} onChange={e => updateGrape(idx, { percentage: e.target.value === '' ? '' : Number(e.target.value) })} inputMode="decimal" />
              </div>
              <div className="md:col-span-2">
                <button type="button" onClick={() => removeGrape(idx)} className="w-full text-sm px-3 py-2 rounded border border-gray-300 hover:bg-gray-50">Remove</button>
              </div>
            </div>
          ))}
          {grapes.length > 0 ? (
            <div className="text-sm text-gray-600">Total: {grapesTotal.toFixed(1)}%</div>
          ) : null}
        </div>
      </section>

      <div className="flex gap-3 items-center">
        <button type="submit" disabled={!canSubmit || submitting} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {submitting ? 'Saving…' : 'Save Wine'}
        </button>
        {!canSubmit ? <span className="text-sm text-gray-600">Complete required fields; grape total must be 100%</span> : null}
      </div>

      {error ? <div className="text-red-600 text-sm">{error}</div> : null}
      {result ? (
        <pre className="mt-4 bg-gray-50 p-4 rounded border text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
      ) : null}
    </form>
  )
}
