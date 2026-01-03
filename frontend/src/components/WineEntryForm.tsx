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
    <div className="space-y-4">
      <WineDetailsInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />
      <PricingQuantityInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />
      <DrinkingWindowInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />
      <GrapeCompositionInput onChange={(v) => setForm((f: any) => ({ ...f, ...v }))} />

      <button onClick={submit} disabled={loading} className="border rounded px-4 py-2">
        {loading ? 'Saving...' : 'Create Wine'}
      </button>
      {error && <div className="text-red-600">{error}</div>}
      {data && <div className="text-green-700">Created!</div>}
    </div>
  )
}
