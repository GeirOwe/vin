import { useCallback, useState } from 'react'
import { getStoredToken } from '../auth/AuthContext'

export type ApiState<T> = {
  loading: boolean
  data: T | null
  error: string | null
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function buildUrl(url: string): string {
  return url.startsWith('http') ? url : `${API_BASE}${url}`
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getStoredToken()
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function errorMessage(data: any, status: number): string {
  if (!data) return `Forespørsel feilet (${status})`
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
  }
  return data.message || `Forespørsel feilet (${status})`
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({ loading: false, data: null, error: null })

  const postJson = useCallback(async (url: string, body: unknown): Promise<T | null> => {
    setState({ loading: true, data: null, error: null })
    try {
      const res = await fetch(buildUrl(url), {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorMessage(data, res.status))
      setState({ loading: false, data, error: null })
      return data
    } catch (err: any) {
      setState({ loading: false, data: null, error: err.message || String(err) })
      return null
    }
  }, [])

  const getJson = useCallback(async (url: string): Promise<T | null> => {
    setState({ loading: true, data: null, error: null })
    try {
      const res = await fetch(buildUrl(url), {
        headers: authHeaders(),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorMessage(data, res.status))
      setState({ loading: false, data, error: null })
      return data
    } catch (err: any) {
      setState({ loading: false, data: null, error: err.message || String(err) })
      return null
    }
  }, [])

  const patchJson = useCallback(async (url: string, body: unknown): Promise<T | null> => {
    setState({ loading: true, data: null, error: null })
    try {
      const res = await fetch(buildUrl(url), {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorMessage(data, res.status))
      setState({ loading: false, data, error: null })
      return data
    } catch (err: any) {
      setState({ loading: false, data: null, error: err.message || String(err) })
      return null
    }
  }, [])

  return { ...state, postJson, getJson, patchJson }
}

export { API_BASE, authHeaders, buildUrl, errorMessage }
