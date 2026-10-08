import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { pieces } from "../src/data/pieces.ts"
import { canBookSlot, slots } from "../src/data/slots.ts"
import { createInitialBooking, saveBooking, restoreBooking, clearSavedBooking } from "../src/state/booking.ts"
import { createInitialFilters, getFilteredPieces } from "../src/ui/renderFilters.ts"
import { clearFavorites, toggleFavorite } from "../src/state/favorites.ts"
import { getToday, isValidBookingDate } from "../src/utils/date.ts"
import { calculateEstimatedPrice, formatPrice } from "../src/utils/price.ts"
import { isBookingComplete, isValidEmail, validateBooking } from "../src/utils/validation.ts"

const storageKey = "atelier-moka-booking-v1"
const savedItems = new Map()

beforeEach(() => {
  savedItems.clear()
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => savedItems.get(key) ?? null,
      setItem: (key, value) => savedItems.set(key, value),
      removeItem: (key) => savedItems.delete(key),
    },
  })
})

function completeBooking() {
  return {
    ...createInitialBooking(),
    people: 3,
    piece: pieces.find((piece) => piece.category === "Vase"),
    date: "2099-10-12",
    time: "14:00",
    firstName: "Camille",
    email: "camille@example.fr",
  }
}

test("chaque état initial est indépendant", () => {
  const first = createInitialBooking()
  first.people = 7
  assert.equal(createInitialBooking().people, 2)
  assert.equal(createInitialBooking().piece, null)
})

test("prix estimé : aucune pièce, prix unitaire et trois participants", () => {
  assert.equal(calculateEstimatedPrice(createInitialBooking()), 0)
  const booking = completeBooking()
  assert.equal(calculateEstimatedPrice(booking), 96)
  booking.people = 1
  assert.equal(calculateEstimatedPrice(booking), 32)
  assert.equal(formatPrice(96), "96 €")
})

test("filtres combinés et absence de résultat", () => {
  const filters = createInitialFilters()
  filters.category = "Vase"
  filters.difficulty = "Intermédiaire"
  filters.availability = "Disponibles"
  assert.deepEqual(getFilteredPieces(filters).map((piece) => piece.id), [4])
  filters.difficulty = "Débutant"
  assert.deepEqual(getFilteredPieces(filters), [])
})

test("tri des prix et catalogue source conservé", () => {
  const originalOrder = pieces.map((piece) => piece.id)
  const filters = createInitialFilters()
  filters.sort = "price-asc"
  assert.deepEqual(getFilteredPieces(filters).map((piece) => piece.price), [18, 22, 24, 26, 28, 32])
  filters.sort = "price-desc"
  assert.deepEqual(getFilteredPieces(filters).map((piece) => piece.price), [32, 28, 26, 24, 22, 18])
  assert.deepEqual(pieces.map((piece) => piece.id), originalOrder)
})

test("recherche : casse et espaces ignorés, aucune correspondance", () => {
  const filters = createInitialFilters()
  filters.search = "  VASE  "
  assert.deepEqual(getFilteredPieces(filters).map((piece) => piece.id), [4])
  filters.search = "introuvable"
  assert.deepEqual(getFilteredPieces(filters), [])
})

test("recherche vide et filtres réinitialisés", () => {
  const filters = createInitialFilters()
  filters.search = "   "
  assert.equal(getFilteredPieces(filters).length, pieces.length)
  filters.search = "vase"
  Object.assign(filters, createInitialFilters())
  assert.equal(filters.search, "")
  assert.equal(getFilteredPieces(filters).length, pieces.length)
})

test("recherche combinée à la difficulté, la catégorie et aux favoris", () => {
  clearFavorites()
  try {
    toggleFavorite(4)
    const filters = createInitialFilters()
    filters.search = "vase"
    filters.category = "Vase"
    filters.difficulty = "Intermédiaire"
    filters.favoritesOnly = true
    assert.deepEqual(getFilteredPieces(filters).map((piece) => piece.id), [4])
    filters.difficulty = "Débutant"
    assert.deepEqual(getFilteredPieces(filters), [])
    filters.difficulty = "Tous"
    clearFavorites()
    assert.deepEqual(getFilteredPieces(filters), [])
  } finally {
    clearFavorites()
  }
})

test("les pièces indisponibles sont identifiables", () => {
  const filters = createInitialFilters()
  filters.availability = "Indisponibles"
  assert.deepEqual(getFilteredPieces(filters).map((piece) => piece.id), [6])
})

test("créneau complet et capacité du groupe", () => {
  const full = slots.find((slot) => slot.time === "11:30")
  const small = slots.find((slot) => slot.time === "17:00")
  assert.equal(canBookSlot(full, 1), false)
  assert.equal(canBookSlot(small, 2), true)
  assert.equal(canBookSlot(small, 3), false)
})

test("dates réelles, date passée et format attendu", () => {
  assert.match(getToday(), /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(isValidBookingDate(getToday()), true)
  assert.equal(isValidBookingDate("2096-02-29"), true)
  for (const value of ["2020-01-01", "2099-02-29", "2099-02-30", "2099-13-01", "12/10/2099", "", "bonjour"]) {
    assert.equal(isValidBookingDate(value), false, value)
  }
})

test("format email minimal", () => {
  assert.equal(isValidEmail("camille@example.fr"), true)
  assert.equal(isValidEmail("camille+atelier@example.fr"), true)
  for (const value of ["", "camille", "@example.fr", "camille@", "camille@example", "ca mille@example.fr"]) {
    assert.equal(isValidEmail(value), false, value)
  }
})

test("validation propre à chaque étape", () => {
  const booking = createInitialBooking()
  assert.deepEqual(Object.keys(validateBooking(booking, 1)), ["date", "time"])
  assert.deepEqual(Object.keys(validateBooking(booking, 2)), ["piece"])
  assert.deepEqual(Object.keys(validateBooking(booking, 3)), ["firstName", "email"])
  assert.equal(isBookingComplete(booking), false)
  assert.equal(isBookingComplete(completeBooking()), true)
})

test("validation finale rejette les capacités, participants et pièces invalides", () => {
  const booking = completeBooking()
  booking.people = 9
  assert.ok(validateBooking(booking).people)
  booking.people = 1.5
  assert.ok(validateBooking(booking).people)
  booking.people = 5
  assert.ok(validateBooking(booking).time)
  booking.people = 3
  booking.piece = pieces.find((piece) => !piece.available)
  assert.ok(validateBooking(booking).piece)
  booking.firstName = "  "
  assert.ok(validateBooking(booking).firstName)
  booking.email = "adresse-invalide"
  assert.ok(validateBooking(booking).email)
})

test("sauvegarde par identifiant et restauration avec les prix du catalogue", () => {
  const booking = completeBooking()
  assert.equal(saveBooking(booking), true)
  const saved = JSON.parse(savedItems.get(storageKey))
  assert.equal(saved.pieceId, 4)
  assert.equal(saved.piece, undefined)
  saved.price = 1
  saved.piece = { id: 4, price: 1 }
  savedItems.set(storageKey, JSON.stringify(saved))
  assert.deepEqual(restoreBooking(), booking)
  assert.equal(restoreBooking().piece.price, 32)
})

test("JSON corrompu et valeurs externes rejetées", () => {
  for (const saved of ["{corrompu", "null", "[]", "12", '"texte"']) {
    savedItems.set(storageKey, saved)
    assert.deepEqual(restoreBooking(), createInitialBooking())
  }
  savedItems.set(storageKey, JSON.stringify({
    people: 100,
    pieceId: 6,
    date: "2020-01-01",
    time: "11:30",
    firstName: {},
    email: [],
  }))
  assert.deepEqual(restoreBooking(), createInitialBooking())
})

test("restauration : créneau avec trop peu de places et longueurs invalides", () => {
  savedItems.set(storageKey, JSON.stringify({
    people: 8,
    pieceId: 4,
    date: "2099-10-12",
    time: "14:00",
    firstName: "C".repeat(61),
    email: "a".repeat(255),
  }))
  const booking = restoreBooking()
  assert.equal(booking.people, 8)
  assert.equal(booking.piece.id, 4)
  assert.equal(booking.time, "")
  assert.equal(booking.firstName, "")
  assert.equal(booking.email, "")
})

test("réinitialisation du stockage et absence de données", () => {
  saveBooking(completeBooking())
  assert.equal(clearSavedBooking(), true)
  assert.equal(savedItems.has(storageKey), false)
  assert.deepEqual(restoreBooking(), createInitialBooking())
})

test("stockage bloqué : retour d’erreur sans arrêter le formulaire", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem() { throw new Error("Stockage bloqué") },
      setItem() { throw new Error("Quota dépassé") },
      removeItem() { throw new Error("Stockage bloqué") },
    },
  })
  assert.deepEqual(restoreBooking(), createInitialBooking())
  assert.equal(saveBooking(completeBooking()), false)
  assert.equal(clearSavedBooking(), false)
})

