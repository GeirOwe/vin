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

  const share = Math.round((1000 / named.length)) / 10
  return named.map((g, idx) => ({
    grape_variety: g.grape_variety!,
    percentage: idx === named.length - 1 ? Math.round((100 - share * (named.length - 1)) * 10) / 10 : share,
  }))
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export default function WineEntryForm() {
  const { postJson, loading, error, data } = useApi<any>()
  const [form, setForm] = useState<any>({})
  const [formKey, setFormKey] = useState(0)
  const [prefill, setPrefill] = useState<any>({})
  const [labelImage, setLabelImage] = useState<Blob | null>(null)

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
    const payload: any = { ...form }
    if (labelImage) {
      payload.label_image_base64 = await blobToBase64(labelImage)
      payload.label_image_content_type = labelImage.type || 'image/jpeg'
    }
    await postJson('/api/wines', payload)
  }

  return (
    <div className="space-y-6">
      <LabelScanInput
        onExtracted={applyLabelExtraction}
        onImageChange={setLabelImage}
        disabled={loading}
      />

      <div className="section space-y-4">
        <div className="section__head">
          <h2>Vindetaljer</h2>
        </div>
        <WineDetailsInput
          key={`details-${formKey}`}
          value={prefill}
          onChange={(v) => setForm((f: any) => ({ ...f, ...v }))}
        />
      </div>

      <div className="section space-y-4">
        <div className="section__head">
          <h2>Pris og antall</h2>
        </div>
        <PricingQuantityInput
          key={`pricing-${formKey}`}
          value={prefill}
          onChange={(v) => setForm((f: any) => ({ ...f, ...v }))}
        />
      </div>

      <div className="section space-y-4">
        <div className="section__head">
          <h2>Drikkevindu</h2>
        </div>
        <DrinkingWindowInput
          key={`drinking-${formKey}`}
          value={prefill}
          onChange={(v) => setForm((f: any) => ({ ...f, ...v }))}
        />
      </div>

      <div className="section space-y-4">
        <div className="section__head">
          <h2>Druvesammensetning</h2>
        </div>
        <GrapeCompositionInput
          key={`grapes-${formKey}`}
          value={prefill.grape_composition}
          onChange={(v) => setForm((f: any) => ({ ...f, grape_composition: v }))}
        />
      </div>

      <div className="pt-2">
        <button onClick={submit} disabled={loading} className="btn btn--primary">
          {loading ? 'Lagrer…' : 'Opprett vin'}
        </button>
        {labelImage && (
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
            Etikettbilde er klart og lagres sammen med vinen.
          </p>
        )}
        {error && <div className="mt-2 text-sm" style={{ color: 'var(--danger)' }}>{error}</div>}
        {data && <div className="mt-2 text-sm" style={{ color: 'var(--brand-accent)' }}>Opprettet!</div>}
      </div>
    </div>
  )
}
