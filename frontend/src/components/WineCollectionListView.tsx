import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { WineListItem, DrinkingWindowStatus } from '../types/wine'
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

interface FilterParams {
  drinking_window_status?: DrinkingWindowStatus
  quantity_filter?: 'non_zero' | 'zero' | 'all'
}

interface WineCollectionListViewProps {
  endpoint?: string
  showSearchAndSort?: boolean
  title?: string
  filterParams?: FilterParams
  emptyStateMessage?: string
}

export default function WineCollectionListView({ 
  endpoint = '/page', 
  showSearchAndSort = true,
  filterParams,
  emptyStateMessage,
}: WineCollectionListViewProps) {
  const navigate = useNavigate()
  const { loading, error, data, getJson } = useApi<PaginatedResponse<WineListItem> | WineListItem[]>()
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('id')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const lastQueryRef = useRef<string>('')

  const fetchData = (pageToFetch: number) => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search_term', searchTerm)
    if (sortBy) params.set('sort_by', sortBy)
    if (sortOrder) params.set('sort_order', sortOrder)
    if (filterParams?.drinking_window_status) {
      params.set('drinking_window_status', filterParams.drinking_window_status)
    }
    if (filterParams?.quantity_filter) {
      params.set('quantity_filter', filterParams.quantity_filter)
    }
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
  }, [searchTerm, sortBy, sortOrder, filterParams?.drinking_window_status])

  const wines: WineListItem[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items
  }, [data])

  const handleWineClick = (wineId: number) => {
    navigate(`/wines/${wineId}`)
  }

  return (
    <div className="section">
      {showSearchAndSort && (
        <div className="section__head">
          <h2>Din samling</h2>
          <p>Søk og sorter for å finne flaskene raskt.</p>
        </div>
      )}

      {showSearchAndSort && (
        <div className="toolbar">
          <input
            className="field-control min-w-[12rem] flex-1"
            placeholder="Søk på navn eller produsent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="field-control" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="id">Nyeste</option>
            <option value="name">Navn</option>
            <option value="producer">Produsent</option>
            <option value="vintage">Årgang</option>
            <option value="type">Type</option>
          </select>
          <select className="field-control" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
            <option value="desc">Synkende</option>
            <option value="asc">Stigende</option>
          </select>
        </div>
      )}

      {loading && <div className="empty-state">Laster…</div>}
      {error && <div className="text-sm" style={{ color: 'var(--danger)' }}>Feil: {error}</div>}

      {!loading && wines.length === 0 && (
        <div className="empty-state">{emptyStateMessage || 'Ingen viner funnet.'}</div>
      )}

      <ul className="entity-list">
        {wines.map((w) => (
          <li key={w.id}>
            <WineEntryDisplayCard wine={w} onClick={() => handleWineClick(w.id)} />
          </li>
        ))}
      </ul>

      {data && !Array.isArray(data) && data.total_pages > 1 && (
        <div className="toolbar mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn btn--ghost btn--small"
          >
            Forrige
          </button>
          <span className="text-sm" style={{ color: 'var(--muted-text)' }}>
            Side {page} av {data.total_pages}
          </span>
          <button
            type="button"
            disabled={page >= data.total_pages}
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            className="btn btn--ghost btn--small"
          >
            Neste
          </button>
        </div>
      )}
    </div>
  )
}