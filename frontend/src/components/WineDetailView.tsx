import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import WineInformationDisplay from './WineInformationDisplay'
import { Wine } from '../types/wine'

export default function WineDetailView() {
  const { id } = useParams<{ id: string }>()
  const { loading, error, data, getJson } = useApi<Wine>()

  const handleQuantityUpdate = () => {
    // Refresh wine data after quantity update
    if (id) {
      getJson(`/api/wines/${id}`)
    }
  }

  const handleWineUpdate = () => {
    // Refresh wine data after any wine update
    if (id) {
      getJson(`/api/wines/${id}`)
    }
  }

  useEffect(() => {
    if (id) {
      getJson(`/api/wines/${id}`)
    }
  }, [id, getJson])

  if (loading) return <div className="empty-state">Laster vindetaljer…</div>
  if (error) return <div className="text-sm" style={{ color: 'var(--danger)' }}>Feil: {error}</div>
  if (!data) return <div className="empty-state">Ingen vindata tilgjengelig</div>

  return (
    <div className="section space-y-4">
      <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>← Tilbake til samlingen</Link>
      </div>
      
      <WineInformationDisplay 
        wine={data} 
        onQuantityUpdate={handleQuantityUpdate}
        onWineUpdate={handleWineUpdate}
        showInventoryTracking={true}
      />
    </div>
  )
}
