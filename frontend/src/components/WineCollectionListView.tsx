import { useEffect, useMemo, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { Input } from './ui/input'
import { Button } from './ui/button'
import WineEntryDisplayCard from './WineEntryDisplayCard'
import { useNavigate } from 'react-router-dom'

// Minimal types based on backend WineListPageResponse
type Grape = { id: number; grape_variety: string; percentage: number }
interface WineItem { id: number; name: string; producer?: string | null; vintage?: number | null; type?: string | null; grape_composition: Grape[]; quantity?: number | null }
interface PageResp { items: WineItem[]; page: number; page_size: number; total_items: number; total_pages: number }

export default function WineCollectionListView() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortBy, setSortBy] = useState<'id'|'name'|'producer'|'vintage'|'type'>('id')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc')
  const [query, setQuery] = useState('')

  const { loading, error, data, getJson } = useApi<PageResp>()
  const navigate = useNavigate()

  const url = useMemo(() => {
    const u = new URL('http://localhost:8000/api/wines/page')
    u.searchParams.set('page', String(page))
    u.searchParams.set('page_size', String(pageSize))
    u.searchParams.set('sort_by', sortBy)
    u.searchParams.set('sort_order', sortOrder)
    return u.toString()
  }, [page, pageSize, sortBy, sortOrder])

  useEffect(() => {
    getJson(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const items = (data?.items ?? []).filter(w => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      w.name.toLowerCase().includes(q) ||
      (w.producer || '').toLowerCase().includes(q) ||
      String(w.vintage || '').includes(q) ||
      (w.type || '').toLowerCase().includes(q)
    )
  })

  const openDetail = (id: number) => {
    navigate(`/wines/${id}`)
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input placeholder="Search wines…" value={query} onChange={e => setQuery(e.target.value)} className="w-64" />
          <Button onClick={() => setPage(1)}>Search</Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-1">Sort by
          <select className="border rounded px-2 py-1" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="producer">Producer</option>
            <option value="vintage">Vintage</option>
            <option value="type">Type</option>
          </select>
        </label>
        <label className="flex items-center gap-1">Order
          <select className="border rounded px-2 py-1" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>
        <label className="flex items-center gap-1">Page size
          <select className="border rounded px-2 py-1" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {loading ? <div className="p-4">Loading…</div> : null}
      {error ? <div className="p-4 text-red-600">{error}</div> : null}
      {!loading && !error && items.length === 0 ? <div className="p-4 text-gray-600">No wines found.</div> : null}

      <div className="grid gap-3">
        {items.map(w => (
          <WineEntryDisplayCard key={w.id} wine={{ id: w.id, name: w.name, producer: w.producer, vintage: w.vintage, quantity: w.quantity }} onClick={openDetail} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">Page {data?.page || page} of {data?.total_pages || 1} · Total {data?.total_items || 0}</div>
        <div className="flex gap-2">
          <Button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
          <Button disabled={(data?.page || page) >= (data?.total_pages || 1) || loading} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}
