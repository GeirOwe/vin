import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Wine } from '../types/wine'
import { DrinkingWindowStatus } from '../types/wine'
import { useApi } from '../hooks/useApi'
import WineEntryDisplayCard from './WineEntryDisplayCard'

interface WineCollectionListViewProps {
  title?: string
  filterParams?: {
    search_term?: string
    wine_type?: string
    vintage?: number
    country?: string
    district?: string
    subdistrict?: string
    drinking_window_status?: DrinkingWindowStatus
  }
  emptyStateMessage?: string
}

export default function WineCollectionListView({ 
  title = "Wine Collection", 
  filterParams = {},
  emptyStateMessage = "No wines found matching the current filters."
}: WineCollectionListViewProps) {
  const { loading, error, data, getJson } = useApi<Wine[]>()
  const navigate = useNavigate()

  const handleWineClick = (wineId: number) => {
    navigate(`/wines/${wineId}`)
  }

  useEffect(() => {
    // Build query parameters
    const queryParams = new URLSearchParams()
    
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString()
    const url = queryString 
      ? `http://localhost:8000/api/wines?${queryString}`
      : 'http://localhost:8000/api/wines'

    getJson(url)
  }, [getJson, JSON.stringify(filterParams)])

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading wines...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">⚠️ Error loading wines</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🍷</div>
          <p className="text-gray-600">{emptyStateMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((wine) => (
          <WineEntryDisplayCard
            key={wine.id}
            wine={wine}
            onClick={handleWineClick}
          />
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {data.length} wine{data.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}