import type { Booking, BookingErrors, BookingStep } from "../types.ts"
import { canBookSlot, maxPeople, slots } from "../data/slots.ts"
import { isValidBookingDate } from "./date.ts"

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function validateBooking(booking: Booking, step: BookingStep = 4): BookingErrors {
  const errors: BookingErrors = {}

  if (step === 1 || step === 4) {
    if (!Number.isInteger(booking.people) || booking.people < 1 || booking.people > maxPeople) {
      errors.people = `Choisissez entre 1 et ${maxPeople} personnes.`
    }
    if (!booking.date) errors.date = "Choisissez la date de votre atelier."
    else if (!isValidBookingDate(booking.date)) errors.date = "Choisissez une date valide, aujourd’hui ou plus tard."

    const slot = slots.find((item) => item.time === booking.time)
    if (!slot) errors.time = "Choisissez un créneau horaire."
    else if (!canBookSlot(slot, booking.people)) errors.time = "Ce créneau ne peut pas accueillir tout votre groupe."
  }

  if ((step === 2 || step === 4) && (!booking.piece || !booking.piece.available)) {
    errors.piece = "Choisissez une pièce disponible pour votre atelier."
  }

  if (step === 3 || step === 4) {
    if (!booking.firstName.trim()) errors.firstName = "Indiquez votre prénom."
    else if (booking.firstName.trim().length > 60) errors.firstName = "Votre prénom doit contenir au maximum 60 caractères."
    if (!booking.email.trim()) errors.email = "Indiquez votre adresse email."
    else if (!isValidEmail(booking.email)) errors.email = "Indiquez un email valide, comme bonjour@exemple.fr."
  }

  return errors
}

export function isBookingComplete(booking: Booking): boolean {
  return Object.keys(validateBooking(booking)).length === 0
}
