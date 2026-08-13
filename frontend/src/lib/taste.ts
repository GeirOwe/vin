export type TasteVerdict =
  | 'mye_vin_for_pengene'
  | 'god_men_for_dyr'
  | 'styr_unna'
  | 'fantastisk'
  | 'grei_nok'

export const TASTE_VERDICTS: { value: TasteVerdict; label: string }[] = [
  { value: 'fantastisk', label: 'Fantastisk!' },
  { value: 'mye_vin_for_pengene', label: 'Mye vin for pengene' },
  { value: 'god_men_for_dyr', label: 'God men for dyr' },
  { value: 'grei_nok', label: 'Grei nok, vurder noe annet?' },
  { value: 'styr_unna', label: 'Styr unna' },
]

export function tasteVerdictLabel(value?: string | null): string {
  if (!value) return '—'
  return TASTE_VERDICTS.find((v) => v.value === value)?.label || value
}

export function formatTasteDice(dice?: number | null): string {
  if (dice == null) return '—'
  return `${dice}/6`
}
