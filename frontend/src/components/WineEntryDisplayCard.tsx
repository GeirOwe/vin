import { useState } from 'react'
import { WineLabelLightbox, WineLabelThumb } from './WineLabelThumb'
import { formatTasteDice, tasteVerdictLabel } from '../lib/taste'

type WineCardProps = {
  wine: {
    id: number
    name: string
    producer?: string | null
    vintage?: number | null
    quantity?: number | null
    purchase_price?: number | null
    drink_after_date?: string | null
    drink_before_date?: string | null
    taste_dice?: number | null
    taste_verdict?: string | null
    has_label_image?: boolean
  }
  onClick?: (id: number) => void
}

function formatPrice(price?: number | null): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(price)
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('nb-NO')
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('nb-NO')
}

export default function WineEntryDisplayCard({ wine, onClick }: WineCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const meta = [wine.producer, wine.vintage].filter(Boolean).join(' · ') || '—'
  const hasTaste = wine.taste_dice != null || Boolean(wine.taste_verdict)

  return (
    <>
      <WineLabelLightbox
        wineId={wine.id}
        alt={`Etikett for ${wine.name}`}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
      <button
        type="button"
        className="entity-row"
        onClick={() => onClick?.(wine.id)}
        aria-label={`Åpne ${wine.name}`}
      >
        <WineLabelThumb
          wineId={wine.id}
          enabled={Boolean(wine.has_label_image)}
          alt={`Etikett for ${wine.name}`}
          onOpen={
            wine.has_label_image
              ? () => setLightboxOpen(true)
              : undefined
          }
        />
        <div className="entity-row__main">
          <span className="entity-row__name">{wine.name}</span>
          <span className="entity-row__meta">{meta}</span>
          <div className="entity-row__facts">
            <span>
              <em>Pris</em> {formatPrice(wine.purchase_price)}
            </span>
            <span>
              <em>Etter</em> {formatDate(wine.drink_after_date)}
            </span>
            <span>
              <em>Før</em> {formatDate(wine.drink_before_date)}
            </span>
          </div>
          {hasTaste && (
            <div className="entity-row__taste">
              {wine.taste_dice != null && (
                <span className="entity-row__dice" title="Terningkast">
                  {formatTasteDice(wine.taste_dice)}
                </span>
              )}
              {wine.taste_verdict && (
                <span className="entity-row__verdict">{tasteVerdictLabel(wine.taste_verdict)}</span>
              )}
            </div>
          )}
        </div>
        <div className="entity-row__stats">
          <span>{wine.quantity ?? 0} flasker</span>
          <span className="entity-row__chevron" aria-hidden="true">
            →
          </span>
        </div>
      </button>
    </>
  )
}
