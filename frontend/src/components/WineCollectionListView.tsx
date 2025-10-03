import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
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
  showSearchAndSort?: boolean
}

export default function WineCollectionListView({ 
  title = "Wine Collection", 
  filterParams = {},
  emptyStateMessage = "No wines found matching the current filters.",
  showSearchAndSort = false
}: WineCollectionListViewProps) {
  const { loading, error, data, getJson } = useApi<any>()
  const navigate = useNavigate()

  // Search and sort state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'producer' | 'vintage' | 'type'>('id')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleWineClick = (wineId: number) => {
    navigate(`/wines/${wineId}`)
  }

  const handleSearch = () => {
    // Trigger a new API call with updated search term
    fetchWines()
  }

  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  // Extract wines array from response (handles both direct array and paginated response)
  const wines = data ? (Array.isArray(data) ? data : data.items || []) : []

  const fetchWines = async () => {
    // Build query parameters
    const queryParams = new URLSearchParams()
    
    // Add filter parameters
    Object.entries(filterParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString())
      }
    })

    // Add search and sort parameters if search/sort is enabled
    if (showSearchAndSort) {
      if (searchTerm.trim()) {
        queryParams.append('search_term', searchTerm.trim())
      }
      queryParams.append('sort_by', sortBy)
      queryParams.append('sort_order', sortOrder)
      queryParams.append('page_size', '50') // Get more results for search
    }

    const queryString = queryParams.toString()
    const endpoint = showSearchAndSort ? '/page' : ''
    const url = queryString 
      ? `http://localhost:8000/api/wines${endpoint}?${queryString}`
      : `http://localhost:8000/api/wines${endpoint}`

    await getJson(url)
  }

  useEffect(() => {
    fetchWines()
  }, [getJson, JSON.stringify(filterParams), showSearchAndSort, sortBy, sortOrder])

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

  if (!wines || wines.length === 0) {
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
      
      {/* Search and Sort Controls */}
      {showSearchAndSort && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Wines
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search by name or producer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>Search</Button>
                </div>
              </div>
              
              {/* Sort */}
              <div className="flex gap-2 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value as typeof sortBy, sortOrder)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="id">ID</option>
                    <option value="name">Name</option>
                    <option value="producer">Producer</option>
                    <option value="vintage">Vintage</option>
                    <option value="type">Type</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => handleSortChange(sortBy, e.target.value as typeof sortOrder)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {wines.map((wine) => (
          <WineEntryDisplayCard
            key={wine.id}
            wine={wine}
            onClick={handleWineClick}
          />
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {wines.length} wine{wines.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}