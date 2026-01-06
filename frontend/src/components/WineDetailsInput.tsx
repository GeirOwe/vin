import { useEffect, useRef, useState } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'

export type WineDetails = {
  name: string
  type: string
  producer: string
  vintage?: number | null
  country?: string | null
  district?: string | null
  subdistrict?: string | null
}

export type WineDetailsInputProps = {
  value?: WineDetails
  onChange: (details: WineDetails) => void
  disabled?: boolean
}

function isFutureYear(year: number): boolean {
  const now = new Date().getFullYear()
  return year > now
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let id: number | undefined
  return (...args: Parameters<T>) => {
    if (id) window.clearTimeout(id)
    id = window.setTimeout(() => fn(...args), delay)
  }
}

export function WineDetailsInput({ value, onChange, disabled }: WineDetailsInputProps) {
  const [name, setName] = useState(value?.name ?? '')
  const [type, setType] = useState(value?.type ?? '')
  const [producer, setProducer] = useState(value?.producer ?? '')
  const [vintage, setVintage] = useState<string>(value?.vintage?.toString() ?? '')
  const [country, setCountry] = useState(value?.country ?? '')
  const [district, setDistrict] = useState(value?.district ?? '')
  const [subdistrict, setSubdistrict] = useState(value?.subdistrict ?? '')

  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const validate = () => {
    const newErrors: Record<string, string | null> = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!type.trim()) newErrors.type = 'Type is required'
    if (!producer.trim()) newErrors.producer = 'Producer is required'

    if (vintage.trim()) {
      if (!/^\d{4}$/.test(vintage.trim())) {
        newErrors.vintage = 'Vintage must be a 4-digit year'
      } else {
        const y = parseInt(vintage, 10)
        if (isFutureYear(y)) newErrors.vintage = 'Vintage cannot be in the future'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const debouncedEmit = useRef(
    debounce((details: WineDetails) => onChange(details), 150)
  )

  const emitIfValid = () => {
    if (!validate()) return
    const details: WineDetails = {
      name: name.trim(),
      type: type.trim(),
      producer: producer.trim(),
      vintage: vintage.trim() ? parseInt(vintage, 10) : undefined,
      country: country.trim() || undefined,
      district: district.trim() || undefined,
      subdistrict: subdistrict.trim() || undefined,
    }
    debouncedEmit.current(details)
  }

  useEffect(() => {
    emitIfValid()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, type, producer, vintage, country, district, subdistrict])

  const fieldClass = 'grid gap-1'
  const errorClass = 'text-sm text-red-600'

  return (
    <div className="grid gap-4">
      <div className={fieldClass}>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g., Barolo Riserva" value={name} onChange={e => setName(e.target.value)} disabled={disabled} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
        {errors.name ? <span id="name-error" className={errorClass}>{errors.name}</span> : null}
      </div>

      <div className={fieldClass}>
        <Label htmlFor="type">Type</Label>
        <Input id="type" placeholder="e.g., Red, White, Rosé" value={type} onChange={e => setType(e.target.value)} disabled={disabled} aria-invalid={!!errors.type} aria-describedby={errors.type ? 'type-error' : undefined} />
        {errors.type ? <span id="type-error" className={errorClass}>{errors.type}</span> : null}
      </div>

      <div className={fieldClass}>
        <Label htmlFor="producer">Producer</Label>
        <Input id="producer" placeholder="e.g., Gaja" value={producer} onChange={e => setProducer(e.target.value)} disabled={disabled} aria-invalid={!!errors.producer} aria-describedby={errors.producer ? 'producer-error' : undefined} />
        {errors.producer ? <span id="producer-error" className={errorClass}>{errors.producer}</span> : null}
      </div>

      <div className={fieldClass}>
        <Label htmlFor="vintage">Vintage</Label>
        <Input id="vintage" placeholder="YYYY" value={vintage} onChange={e => setVintage(e.target.value)} disabled={disabled} inputMode="numeric" aria-invalid={!!errors.vintage} aria-describedby={errors.vintage ? 'vintage-error' : undefined} />
        {errors.vintage ? <span id="vintage-error" className={errorClass}>{errors.vintage}</span> : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={fieldClass}>
          <Label htmlFor="country">Country</Label>
          <Input id="country" placeholder="e.g., Italy" value={country} onChange={e => setCountry(e.target.value)} disabled={disabled} />
        </div>
        <div className={fieldClass}>
          <Label htmlFor="district">District</Label>
          <Input id="district" placeholder="e.g., Piedmont" value={district} onChange={e => setDistrict(e.target.value)} disabled={disabled} />
        </div>
        <div className={fieldClass}>
          <Label htmlFor="subdistrict">Subdistrict</Label>
          <Input id="subdistrict" placeholder="e.g., Barolo" value={subdistrict} onChange={e => setSubdistrict(e.target.value)} disabled={disabled} />
        </div>
      </div>
    </div>
  )
}
