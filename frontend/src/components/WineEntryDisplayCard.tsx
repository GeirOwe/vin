import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'

type WineCardProps = {
  wine: { id: number; name: string; producer?: string | null; vintage?: number | null; quantity?: number | null }
  onClick?: (id: number) => void
}

export default function WineEntryDisplayCard({ wine, onClick }: WineCardProps) {
  return (
    <button className="text-left w-full" onClick={() => onClick?.(wine.id)} aria-label={`Open ${wine.name}`}>
      <Card className="hover:bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{wine.name}</span>
            <span className="text-sm text-gray-600">{wine.vintage ?? '—'}</span>
          </CardTitle>
          <CardDescription>{wine.producer ?? '—'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700"><span className="font-medium">Quantity:</span> {wine.quantity ?? '—'}</div>
        </CardContent>
      </Card>
    </button>
  )
}
