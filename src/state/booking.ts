import type { Booking } from "../types.ts"
import { pieces } from "../data/pieces.ts"
import { canBookSlot, maxPeople, slots } from "../data/slots.ts"
import { isValidBookingDate } from "../utils/date.ts"

const storageKey = "atelier-moka-booking-v1"

export function createInitialBooking(): Booking {
  return { people: 2, piece: null, date: "", time: "", firstName: "", email: "" }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function restoreBooking(): Booking {
  const booking = createInitialBooking()

  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return booking

    // JSON.parse produit des données externes : on vérifie chaque valeur.
    const data: unknown = JSON.parse(saved)
    if (!isRecord(data)) return booking

    if (typeof data.people === "number" && Number.isInteger(data.people) && data.people >= 1 && data.people <= maxPeople) {
      booking.people = data.people
    }
    booking.piece = pieces.find((piece) => piece.id === data.pieceId && piece.available) ?? null
    if (typeof data.date === "string" && isValidBookingDate(data.date)) booking.date = data.date

    const slot = slots.find((item) => item.time === data.time)
    if (booking.date && slot && canBookSlot(slot, booking.people)) booking.time = slot.time
    if (typeof data.firstName === "string" && data.firstName.length <= 60) booking.firstName = data.firstName
    if (typeof data.email === "string" && data.email.length <= 254) booking.email = data.email
  } catch {
    // Le formulaire reste utilisable si le stockage est bloqué ou le JSON corrompu.
  }

  return booking
}

export function saveBooking(booking: Booking): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      people: booking.people,
      pieceId: booking.piece?.id ?? null,
      date: booking.date,
      time: booking.time,
      firstName: booking.firstName,
      email: booking.email,
    }))
    return true
  } catch {
    return false
  }
}

export function clearSavedBooking(): boolean {
  try {
    localStorage.removeItem(storageKey)
    return true
  } catch {
    return false
  }
}
