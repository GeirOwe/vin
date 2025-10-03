import { FormEvent, useMemo, useState } from 'react'
import { WineDetails, WineDetailsInput } from './WineDetailsInput'
import { PricingQuantityInput, PricingQuantity } from './PricingQuantityInput'
import { DrinkingWindowInput, DrinkingWindow } from './DrinkingWindowInput'
import { GrapeCompositionInput, GrapeComposition } from './GrapeCompositionInput'
import { useApi } from '../hooks/useApi'

export default function WineEntryForm() {
  const [details, setDetails] = useState<WineDetails | null>(null)
  const [pq, setPq] = useState<PricingQuantity>({})
  const [dw, setDw] = useState<DrinkingWindow>({})
  const [grapes, setGrapes] = useState<GrapeComposition[]>([])
  const [success, setSuccess] = useState<string | null>(null)

  const { loading, data, error, postJson } = useApi<any>()

  const grapesTotal = useMemo(() => {
    return grapes.reduce((sum, g) => sum + (g?.percentage ?? 0), 0)
  }, [grapes])

  const summaryErrors = useMemo(() => {
    const errs: string[] = []
    if (!details) errs.push('Wine details are incomplete')
    if (grapes.length > 0 && Math.abs(grapesTotal - 100) > 0.5) errs.push('Grape percentages must total 100%')
    return errs
  }, [details, grapes.length, grapesTotal])

  const canSubmit = summaryErrors.length === 0

  function resetForm() {
    setDetails(null)
    setPq({})
    setDw({})
    setGrapes([])
    setSuccess(null)
  }

  // Friendly mapping for backend validation around drinking window
  const drinkingWindowError = error && error.toLowerCase().includes('drink_before_date must be later than drink_after_date')
    ? "Drinking window invalid: 'Drink before' must be later than 'Drink after'."
    : null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSuccess(null)
    if (!canSubmit) return

    const payload: any = {
      ...details!,
      purchase_price: pq.purchase_price ?? undefined,
      quantity: pq.quantity ?? undefined,
      drink_after_date: dw.drink_after_date || undefined,
      drink_before_date: dw.drink_before_date || undefined,
      grape_composition: grapes.length ? grapes.map(g => ({ grape_variety: g.grape_variety, percentage: g.percentage })) : undefined,
    }

    const created = await postJson('http://localhost:8000/api/wines', payload)
    if (created) {
      setSuccess('Wine created successfully')
      resetForm()
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <section className="grid gap-2">
        <h2 className="text-lg font-semibold">Wine Details</h2>
        <WineDetailsInput onChange={setDetails} disabled={loading} />
      </section>

      <section className="grid gap-2">
        <h2 className="text-lg font-semibold">Pricing & Stock</h2>
        <PricingQuantityInput onChange={setPq} disabled={loading} />
      </section>

      <section className="grid gap-2">
        <h2 className="text-lg font-semibold">Drinking Window</h2>
        <DrinkingWindowInput onChange={setDw} disabled={loading} wineType={details?.type} vintage={details?.vintage ?? undefined} />
        {drinkingWindowError ? (
          <div className="text-sm text-red-600">{drinkingWindowError}</div>
        ) : null}
      </section>

      <section className="grid gap-2">
        <GrapeCompositionInput onChange={setGrapes} disabled={loading} />
      </section>

      {summaryErrors.length > 0 ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <ul className="list-disc pl-5">
            {summaryErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex gap-3 items-center">
        <button type="submit" disabled={!canSubmit || loading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
          {loading ? 'Saving…' : 'Save Wine'}
        </button>
        <button type="button" onClick={resetForm} disabled={loading} className="px-4 py-2 rounded border border-gray-300 disabled:opacity-50">
          Cancel / Reset
        </button>
      </div>

      {error && !drinkingWindowError ? <div className="text-red-600 text-sm">{error}</div> : null}
      {success ? <div className="text-green-700 text-sm">{success}</div> : null}
      {data ? (
        <pre className="mt-2 bg-gray-50 p-3 rounded border text-xs overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
      ) : null}
    </form>
  )
}
