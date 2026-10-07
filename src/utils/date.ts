export function getToday(): string {
  // Une date française évite un décalage de jour lié à l’heure UTC.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

export function isValidBookingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return false

  return date.toISOString().slice(0, 10) === value && value >= getToday()
}

export function formatBookingDate(value: string): string {
  if (!isValidBookingDate(value)) return "À choisir"

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeZone: "Europe/Paris",
  }).format(new Date(`${value}T12:00:00Z`))
}
