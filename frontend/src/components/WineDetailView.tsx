import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import WineInformationDisplay from './WineInformationDisplay'
import { Wine } from '../types/wine'

export default function WineDetailView() {
  const { id } = useParams<{ id: string }>()
  const { loading, error, data, getJson } = useApi<Wine>()

  const handleQuantityUpdate = (newQuantity: number) => {
    // Refresh wine data after quantity update
    if (id) {
      getJson(`http://localhost:8000/api/wines/${id}`)
    }
  }

  useEffect(() => {
    if (id) {
      getJson(`http://localhost:8000/api/wines/${id}`)
    }
  }, [id, getJson])

  if (loading) return <div className="p-4">Loading wine details...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  if (!data) return <div className="p-4">No wine data available</div>

  return (
    <div className="p-4 space-y-4">
      <div className="mb-2 text-sm">
        <Link className="underline hover:text-blue-600" to="/">← Back to collection</Link>
      </div>
      
      <WineInformationDisplay 
        wine={data} 
        onQuantityUpdate={handleQuantityUpdate}
        showInventoryTracking={true}
      />
    </div>
  )
}
