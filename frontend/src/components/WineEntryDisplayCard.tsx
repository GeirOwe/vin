import { WineLabelThumb } from './WineLabelThumb'

type WineCardProps = {
  wine: {
    id: number
    name: string
    producer?: string | null
    vintage?: number | null
    quantity?: number | null
    has_label_image?: boolean
  }
  onClick?: (id: number) => void
}

export default function WineEntryDisplayCard({ wine, onClick }: WineCardProps) {
  const meta = [wine.producer, wine.vintage].filter(Boolean).join(' · ') || '—'

  return (
    <button
      type="button"
      className="entity-row"
      onClick={() => onClick?.(wine.id)}
      aria-label={`Åpne ${wine.name}`}
    >
      <WineLabelThumb wineId={wine.id} enabled={Boolean(wine.has_label_image)} alt={`Etikett for ${wine.name}`} />
      <div className="entity-row__main">
        <span className="entity-row__name">{wine.name}</span>
        <span className="entity-row__meta">{meta}</span>
      </div>
      <div className="entity-row__stats">
        <span>{wine.quantity ?? 0} flasker</span>
        <span className="entity-row__chevron" aria-hidden="true">
          →
        </span>
      </div>
    </button>
  )
}
