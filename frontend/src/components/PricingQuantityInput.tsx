import { useEffect, useRef, useState } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'

export type PricingQuantity = {
  purchase_price?: number | null
  quantity?: number | null
}

export type PricingQuantityInputProps = {
  value?: PricingQuantity
  onChange: (pq: PricingQuantity) => void
  disabled?: boolean
  currencySymbol?: string
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let id: number | undefined
  return (...args: Parameters<T>) => {
    if (id) window.clearTimeout(id)
    id = window.setTimeout(() => fn(...args), delay)
  }
}

function formatCurrency(value: string, symbol: string) {
  if (value === '') return ''
  const parts = value.split('.')
  let whole = parts[0].replace(/[^0-9]/g, '')
  let frac = parts[1]?.replace(/[^0-9]/g, '').slice(0, 2) ?? ''
  if (whole.length > 1) whole = whole.replace(/^0+/, '') || '0'
  return frac ? `${symbol}${whole}.${frac}` : `${symbol}${whole}`
}

function parseCurrency(value: string) {
  const clean = value.replace(/[^0-9.]/g, '')
  if (!clean) return null
  const num = Number(clean)
  return Number.isFinite(num) ? num : null
}

export function PricingQuantityInput({ value, onChange, disabled, currencySymbol = '' }: PricingQuantityInputProps) {
  const [priceInput, setPriceInput] = useState<string>(
    value?.purchase_price != null ? `${currencySymbol}${value.purchase_price.toFixed(2)}` : ''
  )
  const [qtyInput, setQtyInput] = useState<string>(value?.quantity != null ? String(value.quantity) : '')

  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const debouncedEmit = useRef(
    debounce((pq: PricingQuantity) => onChange(pq), 150)
  )

  useEffect(() => {
    const errs: Record<string, string | null> = {}

    const parsedPrice = parseCurrency(priceInput ?? '')
    if (priceInput !== '') {
      if (parsedPrice == null || parsedPrice < 0) errs.purchase_price = 'Price must be a positive number'
      const decimals = priceInput.split('.')[1]
      if (decimals && decimals.replace(/[^0-9]/g, '').length > 2) errs.purchase_price = 'Max 2 decimals'
    }

    if (qtyInput !== '') {
      if (!/^\d+$/.test(qtyInput)) errs.quantity = 'Quantity must be a positive integer'
      else if (Number(qtyInput) <= 0) errs.quantity = 'Quantity must be greater than zero'
    }

    setErrors(errs)

    if (Object.keys(errs).length === 0) {
      debouncedEmit.current({
        purchase_price: priceInput === '' ? undefined : parsedPrice,
        quantity: qtyInput === '' ? undefined : Number(qtyInput),
      })
    }
  }, [priceInput, qtyInput])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="grid gap-1">
        <Label htmlFor="purchase_price">Purchase Price</Label>
        <Input
          id="purchase_price"
          placeholder="0.00"
          value={priceInput}
          onChange={e => setPriceInput(formatCurrency(e.target.value, currencySymbol))}
          disabled={disabled}
          inputMode="decimal"
          aria-invalid={!!errors.purchase_price}
          aria-describedby={errors.purchase_price ? 'purchase_price-error' : undefined}
        />
        {errors.purchase_price ? (
          <span id="purchase_price-error" className="text-sm text-red-600">{errors.purchase_price}</span>
        ) : null}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          placeholder="0"
          value={qtyInput}
          onChange={e => setQtyInput(e.target.value.replace(/[^0-9]/g, ''))}
          disabled={disabled}
          inputMode="numeric"
          aria-invalid={!!errors.quantity}
          aria-describedby={errors.quantity ? 'quantity-error' : undefined}
        />
        {errors.quantity ? (
          <span id="quantity-error" className="text-sm text-red-600">{errors.quantity}</span>
        ) : null}
      </div>
    </div>
  )
}
