import type { TimeSlot } from "../types.ts"

// Disponibilités de démonstration, identiques pour chaque date.
export const slots: TimeSlot[] = [
  { time: "10:00", remainingPlaces: 6, available: true },
  { time: "11:30", remainingPlaces: 0, available: false },
  { time: "14:00", remainingPlaces: 4, available: true },
  { time: "15:30", remainingPlaces: 8, available: true },
  { time: "17:00", remainingPlaces: 2, available: true },
  { time: "18:30", remainingPlaces: 6, available: true },
]

export const maxPeople = 8

export function canBookSlot(slot: TimeSlot, people: number): boolean {
  return slot.available && slot.remainingPlaces >= people
}
