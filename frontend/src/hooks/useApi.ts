import { useCallback, useState } from 'react'

export type ApiState<T> = {
  loading: boolean
  data: T | null
  error: string | null
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({ loading: false, data: null, error: null })

  const postJson = useCallback(async (url: string, body: unknown): Promise<T | null> => {
    setState({ loading: true, data: null, error: null })
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`
        throw new Error(message)
      }
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
      const res = await fetch(url)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`
        throw new Error(message)
      }
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
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const message = (data && (data.detail || data.message)) || `Request failed (${res.status})`
        throw new Error(message)
      }
      setState({ loading: false, data, error: null })
      return data
    } catch (err: any) {
      setState({ loading: false, data: null, error: err.message || String(err) })
      return null
    }
  }, [])

  return { ...state, postJson, getJson, patchJson }
}
