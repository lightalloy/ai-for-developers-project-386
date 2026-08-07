const moscow = 'Europe/Moscow'

export function formatSlot(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: moscow,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatRange(startIso: string, endIso: string): string {
  const start = new Intl.DateTimeFormat('ru-RU', {
    timeZone: moscow,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(startIso))
  const end = new Intl.DateTimeFormat('ru-RU', {
    timeZone: moscow,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(endIso))
  return `${start} – ${end}`
}
