import type { Booking } from "../types.ts"

export function calculateEstimatedPrice(booking: Booking): number {
  return (booking.piece?.price ?? 0) * booking.people
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price)
}
