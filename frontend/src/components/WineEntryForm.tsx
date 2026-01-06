import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { WineDetailsInput } from './WineDetailsInput'
import { PricingQuantityInput } from './PricingQuantityInput'
import DrinkingWindowInput from './DrinkingWindowInput'
import { GrapeCompositionInput } from './GrapeCompositionInput'

export default function WineEntryForm() {
  const { postJson, loading, error, data } = useApi<any>()
  const [form, setForm] = useState<any>({})

  const submit = async () => {
    const payload = { ...form }
    const created = await postJson('/api/wines', payload)
    if (created) {
      // Handle success state if needed
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Wine Details</h2>
        <WineDetailsInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pricing & Quantity</h2>
        <PricingQuantityInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Drinking Window</h2>
        <DrinkingWindowInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Grape Composition</h2>
        <GrapeCompositionInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />
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
