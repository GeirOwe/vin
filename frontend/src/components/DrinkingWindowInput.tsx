import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { useApi } from '../hooks/useApi'

export type DrinkingWindow = {
  drink_after_date?: string | null
  drink_before_date?: string | null
}

export type DrinkingWindowInputProps = {
  value?: DrinkingWindow
  onChange: (dw: DrinkingWindow) => void
  disabled?: boolean
  wineType?: string
  vintage?: number
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let id: number | undefined
  return (...args: Parameters<T>) => {
    if (id) window.clearTimeout(id)
    id = window.setTimeout(() => fn(...args), delay)
  }
}

function todayIso(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function DrinkingWindowInput({ value, onChange, disabled, wineType, vintage }: DrinkingWindowInputProps) {
  const [after, setAfter] = useState<string>(value?.drink_after_date ?? '')
  const [before, setBefore] = useState<string>(value?.drink_before_date ?? '')
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const debouncedEmit = useRef(debounce((dw: DrinkingWindow) => onChange(dw), 150))
  const { loading, error, postJson } = useApi<any>()

  useEffect(() => {
    const errs: Record<string, string | null> = {}

    if (after) {
      const min = todayIso()
      if (after < min) errs.drink_after_date = 'Drink after cannot be in the past'
    }
    if (after && before) {
      if (after >= before) errs.range = 'Drink after must be before drink before'
    }

    setErrors(errs)

    if (Object.keys(errs).length === 0) {
      debouncedEmit.current({
        drink_after_date: after || undefined,
        drink_before_date: before || undefined,
      })
    }
  }, [after, before])

  const minAfter = useMemo(() => todayIso(), [])
  const minBefore = after || undefined

  async function suggest() {
    if (!wineType || !vintage) return
    const url = `http://localhost:8000/api/wines/drinking-window-suggestions?wine_type=${encodeURIComponent(wineType)}&vintage=${encodeURIComponent(String(vintage))}`
    const data = await postJson(url, {})
    if (data?.drink_after_date && data?.drink_before_date) {
      setAfter(data.drink_after_date)
      setBefore(data.drink_before_date)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="grid gap-1">
          <Label htmlFor="drink_after">Drink After</Label>
          <Input
            id="drink_after"
            type="date"
            value={after}
            onChange={e => setAfter(e.target.value)}
            disabled={disabled || loading}
            min={minAfter}
            aria-invalid={!!errors.drink_after_date || !!errors.range}
            aria-describedby={errors.drink_after_date ? 'drink_after-error' : errors.range ? 'range-error' : undefined}
          />
          {errors.drink_after_date ? (
            <span id="drink_after-error" className="text-sm text-red-600">{errors.drink_after_date}</span>
          ) : null}
        </div>

        <div className="grid gap-1">
          <Label htmlFor="drink_before">Drink Before</Label>
          <Input
            id="drink_before"
            type="date"
            value={before}
            onChange={e => setBefore(e.target.value)}
            disabled={disabled || loading}
            min={minBefore}
            aria-invalid={!!errors.range}
            aria-describedby={errors.range ? 'range-error' : undefined}
          />
        </div>
      </div>

      {errors.range ? (
        <div className="text-sm text-red-600" id="range-error">{errors.range}</div>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" onClick={suggest} disabled={disabled || loading || !wineType || !vintage}>
          {loading ? 'Suggesting…' : 'Suggest Dates'}
        </Button>
        {error ? <div className="text-sm text-red-600">{error}</div> : null}
      </div>
    </div>
  )
}
