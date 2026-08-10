import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { WineDetailsInput } from './WineDetailsInput'
import { PricingQuantityInput } from './PricingQuantityInput'
import DrinkingWindowInput from './DrinkingWindowInput'
import { GrapeCompositionInput } from './GrapeCompositionInput'
import { LabelScanInput, type LabelExtractionResult } from './LabelScanInput'

function normalizeGrapes(
  grapes: LabelExtractionResult['grape_composition']
): Array<{ grape_variety: string; percentage: number }> | undefined {
  if (!grapes || grapes.length === 0) return undefined
  const named = grapes
    .map((g) => ({
      grape_variety: g.grape_variety?.trim(),
      percentage: g.percentage,
    }))
    .filter((g) => g.grape_variety)

  if (named.length === 0) return undefined

  const withPct = named.filter((g) => g.percentage != null && Number.isFinite(Number(g.percentage)))
  if (withPct.length === named.length) {
    return named.map((g) => ({
      grape_variety: g.grape_variety!,
      percentage: Number(g.percentage),
    }))
  }

  // Equal split when AI listed varieties without reliable %
  const share = Math.round((1000 / named.length)) / 10
  return named.map((g, idx) => ({
    grape_variety: g.grape_variety!,
    percentage: idx === named.length - 1 ? Math.round((100 - share * (named.length - 1)) * 10) / 10 : share,
  }))
}

export default function WineEntryForm() {
  const { postJson, loading, error, data } = useApi<any>()
  const [form, setForm] = useState<any>({})
  const [formKey, setFormKey] = useState(0)
  const [prefill, setPrefill] = useState<any>({})

  const applyLabelExtraction = (extracted: LabelExtractionResult) => {
    const grape_composition = normalizeGrapes(extracted.grape_composition)
    const next = {
      name: extracted.name || undefined,
      type: extracted.type || undefined,
      producer: extracted.producer || undefined,
      vintage: extracted.vintage ?? undefined,
      country: extracted.country || undefined,
      district: extracted.district || undefined,
      subdistrict: extracted.subdistrict || undefined,
      grape_composition,
    }
    setPrefill(next)
    setForm((f: any) => ({ ...f, ...next }))
    setFormKey((k) => k + 1)
  }

  const submit = async () => {
    const payload = { ...form }
    const created = await postJson('/api/wines', payload)
    if (created) {
      // Handle success state if needed
    }
  }

  return (
    <div className="space-y-6 p-4">
      <LabelScanInput onExtracted={applyLabelExtraction} disabled={loading} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Wine Details</h2>
        <WineDetailsInput
          key={`details-${formKey}`}
          value={prefill}
          onChange={(v) => setForm((f: any) => ({ ...f, ...v }))}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pricing & Quantity</h2>
        <PricingQuantityInput
          key={`pricing-${formKey}`}
          value={prefill}
          onChange={(v) => setForm((f: any) => ({ ...f, ...v }))}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Drinking Window</h2>
        <DrinkingWindowInput
          key={`drinking-${formKey}`}
          value={prefill}
          onChange={(v) => setForm((f: any) => ({ ...f, ...v }))}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Grape Composition</h2>
        <GrapeCompositionInput
          key={`grapes-${formKey}`}
          value={prefill.grape_composition}
          onChange={(v) => setForm((f: any) => ({ ...f, grape_composition: v }))}
        />
      </div>

      <div className="pt-4">
        <button onClick={submit} disabled={loading} className="border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400">
          {loading ? 'Saving...' : 'Create Wine'}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {data && <div className="text-green-700 mt-2">Created!</div>}
      </div>
    </div>
  )
}
