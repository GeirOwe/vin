import { useEffect, useMemo, useRef, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { WineListItem } from '../types/wine'
import WineEntryDisplayCard from './WineEntryDisplayCard'

interface PaginatedResponse<T> {
  items: T[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
}

type SortBy = 'id' | 'name' | 'producer' | 'vintage' | 'type'

type SortOrder = 'asc' | 'desc'

export default function WineCollectionListView({ endpoint = '/page', showSearchAndSort = true }: { endpoint?: string; showSearchAndSort?: boolean }) {
  const { loading, error, data, getJson } = useApi<PaginatedResponse<WineListItem> | WineListItem[]>()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('id')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const lastQueryRef = useRef<string>('')

  const fetchData = (pageToFetch: number) => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search_term', searchTerm)
    if (sortBy) params.set('sort_by', sortBy)
    if (sortOrder) params.set('sort_order', sortOrder)
    params.set('page', String(pageToFetch))
    params.set('page_size', String(pageSize))

    const queryString = params.toString()
    const url = queryString.length > 0
      ? `/api/wines${endpoint}?${queryString}`
      : `/api/wines${endpoint}`

    lastQueryRef.current = url
    getJson(url)
  }

  useEffect(() => {
    fetchData(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  useEffect(() => {
    setPage(1)
    fetchData(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, sortBy, sortOrder])

  const wines: WineListItem[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items
  }, [data])

  const handleWineClick = (wineId: number) => {
    window.location.href = `/wines/${wineId}`
  }

  return (
    <div className="p-4">
      {showSearchAndSort && (
        <div className="mb-4 flex gap-2 items-center">
          <input
            className="border rounded px-2 py-1 w-64"
            placeholder="Search by name or producer"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="id">Newest</option>
            <option value="name">Name</option>
            <option value="producer">Producer</option>
            <option value="vintage">Vintage</option>
            <option value="type">Type</option>
          </select>
          <select className="border rounded px-2 py-1" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      )}

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wines.map((w) => (
          <WineEntryDisplayCard key={w.id} wine={w} onClick={() => handleWineClick(w.id)} />
        ))}
      </div>

      {data && !Array.isArray(data) && (
        <div className="flex gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="border rounded px-3 py-1">
            Prev
          </button>
          <span className="px-2 py-1">Page {page} of {data.total_pages}</span>
          <button disabled={page >= data.total_pages} onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))} className="border rounded px-3 py-1">
            Next
          </button>
        </div>
      )}
    </div>
  )
}