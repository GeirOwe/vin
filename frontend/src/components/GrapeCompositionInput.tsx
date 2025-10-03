import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'

export type GrapeComposition = { grape_variety: string; percentage: number }

export type GrapeCompositionInputProps = {
  value?: GrapeComposition[]
  onChange: (grapes: GrapeComposition[]) => void
  disabled?: boolean
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let id: number | undefined
  return (...args: Parameters<T>) => {
    if (id) window.clearTimeout(id)
    id = window.setTimeout(() => fn(...args), delay)
  }
}

function sanitizePercentageInput(value: string): string {
  // Allow digits and a single dot, max one decimal place
  const cleaned = value.replace(/[^0-9.]/g, '')
  const [whole, frac = ''] = cleaned.split('.')
  const sanitizedWhole = (whole || '').replace(/^0+(\d)/, '$1') // keep single leading zero if needed
  const sanitizedFrac = frac.slice(0, 1)
  return frac !== undefined && cleaned.includes('.')
    ? `${sanitizedWhole}.${sanitizedFrac}`
    : sanitizedWhole
}

export function GrapeCompositionInput({ value, onChange, disabled }: GrapeCompositionInputProps) {
  const [rows, setRows] = useState<Array<{ grape_variety: string; percentage: string }>>(
    (value ?? []).map(g => ({ grape_variety: g.grape_variety, percentage: String(g.percentage) }))
  )
  const [errors, setErrors] = useState<string | null>(null)

  const debouncedEmit = useRef(debounce((grapes: GrapeComposition[]) => onChange(grapes), 150))

  const total = useMemo(() => {
    return rows.reduce((sum, r) => sum + (r.percentage === '' ? 0 : Number(r.percentage)), 0)
  }, [rows])

  useEffect(() => {
    // Validate: non-empty names, percentages 0..100 (<= 1 decimal), total <= 100
    let err: string | null = null
    for (const r of rows) {
      if (r.grape_variety.trim() === '') {
        err = 'Grape variety name cannot be empty'
        break
      }
      if (r.percentage === '') continue
      const num = Number(r.percentage)
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        err = 'Percentages must be numbers between 0 and 100'
        break
      }
      const frac = r.percentage.split('.')[1]
      if (frac && frac.length > 1) {
        err = 'Percentages allow at most 1 decimal place'
        break
      }
    }
    if (!err && total > 100.0 + 1e-9) {
      err = 'Total percentage cannot exceed 100%'
    }

    setErrors(err)

    if (!err) {
      const out: GrapeComposition[] = rows
        .filter(r => r.grape_variety.trim() !== '')
        .map(r => ({ grape_variety: r.grape_variety.trim(), percentage: r.percentage === '' ? 0 : Number(r.percentage) }))
      debouncedEmit.current(out)
    }
  }, [rows, total])

  const addRow = () => setRows(r => [...r, { grape_variety: '', percentage: '' }])
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx))
  const updateRow = (idx: number, patch: Partial<{ grape_variety: string; percentage: string }>) =>
    setRows(r => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)))

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Grape Composition</h3>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
        >
          Add grape
        </button>
      </div>

      <div className="grid gap-3">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-7 grid gap-1">
              <Label htmlFor={`grape_${idx}`}>Variety</Label>
              <Input
                id={`grape_${idx}`}
                placeholder="e.g., Cabernet Sauvignon"
                value={row.grape_variety}
                onChange={e => updateRow(idx, { grape_variety: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div className="md:col-span-3 grid gap-1">
              <Label htmlFor={`pct_${idx}`}>Percentage</Label>
              <Input
                id={`pct_${idx}`}
                placeholder="e.g., 60.5"
                value={row.percentage}
                onChange={e => updateRow(idx, { percentage: sanitizePercentageInput(e.target.value) })}
                inputMode="decimal"
                disabled={disabled}
                aria-invalid={!!errors}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => removeRow(idx)}
                disabled={disabled}
                className="w-full text-sm px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Total: {total.toFixed(1)}%</span>
        {errors ? <span className="text-red-600">{errors}</span> : null}
      </div>
    </div>
  )
}
