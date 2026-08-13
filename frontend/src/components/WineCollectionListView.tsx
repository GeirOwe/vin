import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, API_BASE, authHeaders } from '../hooks/useApi'
import { WineListItem, DrinkingWindowStatus, WineType } from '../types/wine'
import WineEntryDisplayCard from './WineEntryDisplayCard'

interface PaginatedResponse<T> {
  items: T[]
  page: number
  page_size: number
  total_items: number
  total_pages: number
}

type SortBy = 'purchase_price' | 'drink_after_date' | 'drink_before_date'

type SortOrder = 'asc' | 'desc'

interface FilterParams {
  drinking_window_status?: DrinkingWindowStatus
  quantity_filter?: 'non_zero' | 'zero' | 'all'
}

interface FilterOptions {
  types: string[]
  districts: string[]
  grapes: string[]
}

interface WineCollectionListViewProps {
  endpoint?: string
  showSearchAndSort?: boolean
  title?: string
  filterParams?: FilterParams
  emptyStateMessage?: string
}

const WINE_TYPE_LABELS: Record<string, string> = {
  Red: 'Rød',
  White: 'Hvit',
  Rose: 'Rosé',
  Sparkling: 'Musserende',
  Dessert: 'Dessert',
  Fortified: 'Sterkvin',
}

const ALL_WINE_TYPES: WineType[] = ['Red', 'White', 'Rose', 'Sparkling', 'Dessert', 'Fortified']

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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [wineType, setWineType] = useState('')
  const [grape, setGrape] = useState('')
  const [district, setDistrict] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('drink_before_date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ types: [], districts: [], grapes: [] })
  const lastQueryRef = useRef<string>('')

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300)
    return () => window.clearTimeout(id)
  }, [searchTerm])

  useEffect(() => {
    if (!showSearchAndSort) return
    let cancelled = false
    const loadOptions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/wines/filter-options`, {
          headers: authHeaders(),
        })
        if (!res.ok) return
        const json = (await res.json()) as FilterOptions
        if (!cancelled) setFilterOptions(json)
      } catch {
        // keep empty options
      }
    }
    loadOptions()
    return () => {
      cancelled = true
    }
  }, [showSearchAndSort])

  const typeChoices = useMemo(() => {
    const fromApi = filterOptions.types.length ? filterOptions.types : ALL_WINE_TYPES
    return fromApi
  }, [filterOptions.types])

  const fetchData = (pageToFetch: number) => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search_term', debouncedSearch)
    if (wineType) params.set('wine_type', wineType)
    if (grape) params.set('grape', grape)
    if (district) params.set('district', district)
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
  }, [
    debouncedSearch,
    wineType,
    grape,
    district,
    sortBy,
    sortOrder,
    filterParams?.drinking_window_status,
    filterParams?.quantity_filter,
  ])

  const wines: WineListItem[] = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.items
  }, [data])

  const handleWineClick = (wineId: number) => {
    navigate(`/wines/${wineId}`)
  }

  const hasActiveFilters = Boolean(debouncedSearch || wineType || grape || district)

  return (
    <div className="section">
      {showSearchAndSort && (
        <div className="section__head">
          <h2>Din samling</h2>
          <p>Søk, filtrer og sorter samlingen.</p>
        </div>
      )}

      {showSearchAndSort && (
        <div className="toolbar toolbar--filters">
          <input
            className="field-control toolbar__search"
            placeholder="Søk på navn eller produsent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="field-control"
            value={wineType}
            onChange={(e) => setWineType(e.target.value)}
            aria-label="Filtrer på type"
          >
            <option value="">Alle typer</option>
            {typeChoices.map((t) => (
              <option key={t} value={t}>
                {WINE_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
          <select
            className="field-control"
            value={grape}
            onChange={(e) => setGrape(e.target.value)}
            aria-label="Filtrer på drue"
          >
            <option value="">Alle druer</option>
            {filterOptions.grapes.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            className="field-control"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="Filtrer på distrikt"
          >
            <option value="">Alle distrikt</option>
            {filterOptions.districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <label className="toolbar__label">
            Sorter
            <select className="field-control" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
              <option value="purchase_price">Kjøpspris</option>
              <option value="drink_after_date">Drikke etter</option>
              <option value="drink_before_date">Drikke før</option>
            </select>
          </label>
          <select className="field-control" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
            <option value="asc">Stigende</option>
            <option value="desc">Synkende</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => {
                setSearchTerm('')
                setDebouncedSearch('')
                setWineType('')
                setGrape('')
                setDistrict('')
              }}
            >
              Nullstill
            </button>
          )}
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
