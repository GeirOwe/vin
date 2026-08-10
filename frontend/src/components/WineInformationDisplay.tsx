import { useEffect, useState } from 'react'
import { Input } from './ui/input'
import { Wine } from '../types/wine'
import { useApi } from '../hooks/useApi'
import InventoryTrackingSystemView from './InventoryTrackingSystemView'
import { GrapeCompositionInput, type GrapeComposition } from './GrapeCompositionInput'
import { WineLabelLightbox, WineLabelThumb } from './WineLabelThumb'

interface WineInformationDisplayProps {
  wine: Wine
  onQuantityUpdate?: (newQuantity: number) => void
  onWineUpdate?: () => void
  showInventoryTracking?: boolean
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

async function compressImage(file: File, maxEdge = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Kunne ikke behandle bildet')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  )
  if (!blob) throw new Error('Kunne ikke komprimere bildet')
  return blob
}

export default function WineInformationDisplay({
  wine,
  onQuantityUpdate,
  onWineUpdate,
  showInventoryTracking = false,
}: WineInformationDisplayProps) {
  const [isEditingOm, setIsEditingOm] = useState(false)
  const [isEditingDruer, setIsEditingDruer] = useState(false)
  const [isEditingDrinkingWindow, setIsEditingDrinkingWindow] = useState(false)

  const [name, setName] = useState(wine.name)
  const [producer, setProducer] = useState(wine.producer || '')
  const [vintage, setVintage] = useState(wine.vintage?.toString() || '')
  const [type, setType] = useState(wine.type || '')
  const [country, setCountry] = useState(wine.country || '')
  const [district, setDistrict] = useState(wine.district || '')
  const [subdistrict, setSubdistrict] = useState(wine.subdistrict || '')
  const [purchasePrice, setPurchasePrice] = useState(wine.purchase_price?.toString() || '')
  const [labelImage, setLabelImage] = useState<Blob | null>(null)
  const [labelPreview, setLabelPreview] = useState<string | null>(null)
  const [labelThumbKey, setLabelThumbKey] = useState(0)

  const [drinkAfterDate, setDrinkAfterDate] = useState(wine.drink_after_date || '')
  const [drinkBeforeDate, setDrinkBeforeDate] = useState(wine.drink_before_date || '')

  const [grapes, setGrapes] = useState<GrapeComposition[]>(
    (wine.grape_composition || []).map((g) => ({
      grape_variety: g.grape_variety,
      percentage: g.percentage,
    }))
  )
  const [grapeFormKey, setGrapeFormKey] = useState(0)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const { patchJson } = useApi()

  useEffect(() => {
    setName(wine.name)
    setProducer(wine.producer || '')
    setVintage(wine.vintage?.toString() || '')
    setType(wine.type || '')
    setCountry(wine.country || '')
    setDistrict(wine.district || '')
    setSubdistrict(wine.subdistrict || '')
    setPurchasePrice(wine.purchase_price?.toString() || '')
    setDrinkAfterDate(wine.drink_after_date || '')
    setDrinkBeforeDate(wine.drink_before_date || '')
    setGrapes(
      (wine.grape_composition || []).map((g) => ({
        grape_variety: g.grape_variety,
        percentage: g.percentage,
      }))
    )
    setLabelThumbKey((k) => k + 1)
  }, [wine])

  const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return '—'
    return price.toFixed(2)
  }

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('nb-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return String(date)
    }
  }

  const formatDrinkingWindow = (after?: string | null, before?: string | null): string => {
    if (!after && !before) return '—'
    return `${formatDate(after || undefined)} → ${formatDate(before || undefined)}`
  }

  const resetOmFields = () => {
    setName(wine.name)
    setProducer(wine.producer || '')
    setVintage(wine.vintage?.toString() || '')
    setType(wine.type || '')
    setCountry(wine.country || '')
    setDistrict(wine.district || '')
    setSubdistrict(wine.subdistrict || '')
    setPurchasePrice(wine.purchase_price?.toString() || '')
    setLabelImage(null)
    if (labelPreview) URL.revokeObjectURL(labelPreview)
    setLabelPreview(null)
    setSaveError(null)
  }

  const handleSaveOm = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const updateData: any = {}
      if (name) updateData.name = name
      if (producer) updateData.producer = producer
      if (vintage) updateData.vintage = parseInt(vintage, 10)
      if (type) updateData.type = type
      updateData.country = country || null
      updateData.district = district || null
      updateData.subdistrict = subdistrict || null
      if (purchasePrice !== '') updateData.purchase_price = parseFloat(purchasePrice)

      if (labelImage) {
        updateData.label_image_base64 = await blobToBase64(labelImage)
        updateData.label_image_content_type = labelImage.type || 'image/jpeg'
      }

      const result = await patchJson(`/api/wines/${wine.id}`, updateData)
      if (!result) {
        setSaveError('Kunne ikke lagre endringene')
        return
      }
      setIsEditingOm(false)
      setLabelImage(null)
      if (labelPreview) URL.revokeObjectURL(labelPreview)
      setLabelPreview(null)
      onWineUpdate?.()
    } catch (error) {
      console.error('Failed to update wine:', error)
      setSaveError('Kunne ikke lagre endringene')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDruer = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const cleaned = grapes
        .filter((g) => g.grape_variety.trim())
        .map((g) => ({ grape_variety: g.grape_variety.trim(), percentage: Number(g.percentage) }))
      const result = await patchJson(`/api/wines/${wine.id}`, {
        grape_composition: cleaned,
      })
      if (!result) {
        setSaveError('Kunne ikke lagre druvene (prosent bør summere til 100)')
        return
      }
      setIsEditingDruer(false)
      onWineUpdate?.()
    } catch (error) {
      console.error('Failed to update grapes:', error)
      setSaveError('Kunne ikke lagre druvene')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDrinkingWindow = async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const updateData: any = {}
      if (drinkAfterDate) updateData.drink_after_date = drinkAfterDate
      if (drinkBeforeDate) updateData.drink_before_date = drinkBeforeDate
      const result = await patchJson(`/api/wines/${wine.id}`, updateData)
      if (!result) {
        setSaveError('Kunne ikke lagre drikkevindu')
        return
      }
      setIsEditingDrinkingWindow(false)
      onWineUpdate?.()
    } catch (error) {
      console.error('Failed to update drinking window:', error)
      setSaveError('Kunne ikke lagre drikkevindu')
    } finally {
      setIsSaving(false)
    }
  }

  const onLabelFile = async (file: File | null) => {
    if (labelPreview) URL.revokeObjectURL(labelPreview)
    if (!file) {
      setLabelImage(null)
      setLabelPreview(null)
      return
    }
    try {
      const compressed = await compressImage(file)
      setLabelImage(compressed)
      setLabelPreview(URL.createObjectURL(compressed))
    } catch (err: any) {
      setSaveError(err?.message || 'Kunne ikke lese bildet')
    }
  }

  return (
    <div className="wine-detail">
      {saveError && (
        <div className="text-sm mb-3" style={{ color: 'var(--danger)' }}>
          {saveError}
        </div>
      )}

      <WineLabelLightbox
        wineId={wine.id}
        alt={`Etikett for ${wine.name}`}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {!isEditingOm && (
        <div className="wine-detail__hero">
          <WineLabelThumb
            key={`hero-thumb-${labelThumbKey}`}
            wineId={wine.id}
            enabled={Boolean(wine.has_label_image)}
            alt={`Etikett for ${wine.name}`}
            className="entity-row__thumb--lg"
            onOpen={wine.has_label_image ? () => setLightboxOpen(true) : undefined}
          />
          <div>
            <h1 className="wine-detail__title">{wine.name}</h1>
            <p className="wine-detail__sub">
              {[wine.producer, wine.vintage].filter(Boolean).join(' · ') || '—'}
            </p>
            <p className="wine-detail__meta">
              {[wine.type, wine.country, wine.district].filter(Boolean).join(' · ') || 'Uten sted'}
              {wine.purchase_price != null ? ` · ${formatPrice(wine.purchase_price)}` : ''}
            </p>
          </div>
        </div>
      )}

      <section className="wine-block">
        <div className="wine-block__head">
          <h2>Om</h2>
          {!isEditingOm && (
            <button type="button" className="btn btn--ghost btn--small" onClick={() => setIsEditingOm(true)}>
              Rediger
            </button>
          )}
        </div>

        {isEditingOm ? (
          <div className="space-y-4">
            <div className="wine-fields">
              <div>
                <label className="wine-field__label">Navn</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="wine-field__label">Produsent</label>
                <Input value={producer} onChange={(e) => setProducer(e.target.value)} />
              </div>
              <div>
                <label className="wine-field__label">Årgang</label>
                <Input type="number" value={vintage} onChange={(e) => setVintage(e.target.value)} />
              </div>
              <div>
                <label className="wine-field__label">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="field-control w-full"
                >
                  <option value="">Velg type</option>
                  <option value="Red">Rød</option>
                  <option value="White">Hvit</option>
                  <option value="Rose">Rosé</option>
                  <option value="Sparkling">Musserende</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Fortified">Sterkvin</option>
                </select>
              </div>
              <div>
                <label className="wine-field__label">Kjøpspris</label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="wine-fields wine-fields--3">
              <div>
                <label className="wine-field__label">Land</label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div>
                <label className="wine-field__label">Distrikt</label>
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} />
              </div>
              <div>
                <label className="wine-field__label">Underdistrikt</label>
                <Input value={subdistrict} onChange={(e) => setSubdistrict(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <span className="wine-field__label">Etikettbilde</span>
              <div className="flex flex-wrap items-start gap-3">
                {labelPreview ? (
                  <img
                    src={labelPreview}
                    alt="Nytt etikettbilde"
                    className="entity-row__thumb entity-row__thumb--lg"
                  />
                ) : (
                  <WineLabelThumb
                    key={`edit-thumb-${labelThumbKey}`}
                    wineId={wine.id}
                    enabled={Boolean(wine.has_label_image)}
                    alt={`Etikett for ${wine.name}`}
                    className="entity-row__thumb--lg"
                    onOpen={wine.has_label_image ? () => setLightboxOpen(true) : undefined}
                  />
                )}
                <label className="btn btn--ghost btn--small cursor-pointer">
                  {wine.has_label_image || labelImage ? 'Bytt bilde' : 'Legg til bilde'}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => onLabelFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn--primary" onClick={handleSaveOm} disabled={isSaving}>
                {isSaving ? 'Lagrer…' : 'Lagre'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  resetOmFields()
                  setIsEditingOm(false)
                }}
                disabled={isSaving}
              >
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="wine-fields">
              <div>
                <span className="wine-field__label">Navn</span>
                <p className="wine-field__value">{wine.name}</p>
              </div>
              <div>
                <span className="wine-field__label">Produsent</span>
                <p className="wine-field__value">{wine.producer || '—'}</p>
              </div>
              <div>
                <span className="wine-field__label">Årgang</span>
                <p className="wine-field__value">{wine.vintage ?? '—'}</p>
              </div>
              <div>
                <span className="wine-field__label">Type</span>
                <p className="wine-field__value">{wine.type || '—'}</p>
              </div>
              <div>
                <span className="wine-field__label">Kjøpspris</span>
                <p className="wine-field__value">{formatPrice(wine.purchase_price)}</p>
              </div>
            </div>
            <div className="wine-fields wine-fields--3">
              <div>
                <span className="wine-field__label">Land</span>
                <p className="wine-field__value">{wine.country || '—'}</p>
              </div>
              <div>
                <span className="wine-field__label">Distrikt</span>
                <p className="wine-field__value">{wine.district || '—'}</p>
              </div>
              <div>
                <span className="wine-field__label">Underdistrikt</span>
                <p className="wine-field__value">{wine.subdistrict || '—'}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="wine-block">
        <div className="wine-block__head">
          <h2>Drikkevindu</h2>
          {!isEditingDrinkingWindow && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setIsEditingDrinkingWindow(true)}
            >
              {wine.drink_after_date || wine.drink_before_date ? 'Rediger' : 'Legg til'}
            </button>
          )}
        </div>
        {isEditingDrinkingWindow ? (
          <div className="space-y-4">
            <div className="wine-fields">
              <div>
                <label className="wine-field__label">Drikk etter</label>
                <Input type="date" value={drinkAfterDate} onChange={(e) => setDrinkAfterDate(e.target.value)} />
              </div>
              <div>
                <label className="wine-field__label">Drikk før</label>
                <Input type="date" value={drinkBeforeDate} onChange={(e) => setDrinkBeforeDate(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn--primary" onClick={handleSaveDrinkingWindow} disabled={isSaving}>
                {isSaving ? 'Lagrer…' : 'Lagre'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setDrinkAfterDate(wine.drink_after_date || '')
                  setDrinkBeforeDate(wine.drink_before_date || '')
                  setIsEditingDrinkingWindow(false)
                }}
                disabled={isSaving}
              >
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <div>
            <span className="wine-field__label">Anbefalt periode</span>
            <p className="wine-field__value">{formatDrinkingWindow(wine.drink_after_date, wine.drink_before_date)}</p>
          </div>
        )}
      </section>

      <section className="wine-block">
        <div className="wine-block__head">
          <h2>Druer</h2>
          {!isEditingDruer && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                const existing = (wine.grape_composition || []).map((g) => ({
                  grape_variety: g.grape_variety,
                  percentage: g.percentage,
                }))
                setGrapes(existing.length ? existing : [{ grape_variety: '', percentage: 0 }])
                setGrapeFormKey((k) => k + 1)
                setIsEditingDruer(true)
              }}
            >
              {wine.grape_composition?.length ? 'Rediger' : 'Legg til'}
            </button>
          )}
        </div>
        {isEditingDruer ? (
          <div className="space-y-4">
            <GrapeCompositionInput
              key={`grapes-${grapeFormKey}`}
              value={grapes}
              onChange={setGrapes}
              disabled={isSaving}
              showHeading={false}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn--primary" onClick={handleSaveDruer} disabled={isSaving}>
                {isSaving ? 'Lagrer…' : 'Lagre'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setGrapes(
                    (wine.grape_composition || []).map((g) => ({
                      grape_variety: g.grape_variety,
                      percentage: g.percentage,
                    }))
                  )
                  setIsEditingDruer(false)
                }}
                disabled={isSaving}
              >
                Avbryt
              </button>
            </div>
          </div>
        ) : wine.grape_composition && wine.grape_composition.length > 0 ? (
          <div>
            {wine.grape_composition.map((gc) => (
              <div key={gc.id} className="wine-grape-row">
                <span>{gc.grape_variety}</span>
                <span className="wine-grape-row__pct">{gc.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state" style={{ padding: 0 }}>
            Ingen druer registrert
          </p>
        )}
      </section>

      {showInventoryTracking && (
        <section className="wine-block">
          <div className="wine-block__head">
            <h2>Beholdning</h2>
          </div>
          <InventoryTrackingSystemView
            wineId={wine.id}
            initialQuantity={wine.quantity ?? 0}
            onQuantityUpdate={onQuantityUpdate}
          />
        </section>
      )}
    </div>
  )
}
