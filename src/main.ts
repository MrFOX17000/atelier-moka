import "./style.css"
import { pieces, getPieceById } from "./data/pieces.ts"
import { canBookSlot, maxPeople, slots } from "./data/slots.ts"
import { clearSavedBooking, createInitialBooking, restoreBooking, saveBooking } from "./state/booking.ts"
import type { BookingErrors, BookingStep } from "./types.ts"
import { renderBooking, renderBookingErrors, updateBooking, focusFirstError } from "./ui/renderBooking.ts"
import { createInitialFilters, getFilteredPieces, renderFilters } from "./ui/renderFilters.ts"
import { renderPieces } from "./ui/renderPieces.ts"
import { validateBooking } from "./utils/validation.ts"
import { toggleFavorite, getFavoriteCount, clearFavorites } from "./state/favorites.ts"
import { formatPrice } from "./utils/price.ts"

let booking = restoreBooking()
let currentStep: BookingStep = 1
let errors: BookingErrors = {}
const filters = createInitialFilters()

function announce(message: string): void {
  const status = document.querySelector<HTMLElement>("#booking-status")
  if (status) status.textContent = message
}

function persistBooking(): boolean {
  const saved = saveBooking(booking)
  const status = document.querySelector<HTMLElement>("#storage-status")
  if (status) status.textContent = saved
    ? "Brouillon sauvegardé sur cet appareil."
    : "La sauvegarde est indisponible. Gardez cette page ouverte pour conserver vos choix."
  return saved
}

function refreshCatalogue(): void {
  const container = document.querySelector<HTMLElement>("#pieces")
  const count = document.querySelector<HTMLElement>("#results-count")
  const favoritesCountElement = document.querySelector<HTMLElement>("#favorites-count")
  const clearFavoritesButton = document.querySelector<HTMLButtonElement>("#clear-favorites")
  const favoritePiecesCount = getFavoriteCount()
  if (clearFavoritesButton) {
    clearFavoritesButton.disabled = favoritePiecesCount === 0
  }
  const filteredPieces = getFilteredPieces(filters)
  renderFilters(filters)
  if (container) renderPieces(container, filteredPieces, booking.piece?.id)
  if (count) count.textContent = `${filteredPieces.length} ${filteredPieces.length > 1 ? "pièces" : "pièce"}`
  if (favoritesCountElement) {
    favoritesCountElement.textContent =
      `${favoritePiecesCount} ${favoritePiecesCount === 1 ? "favori" : "favoris"}`
  }
  const selection = document.querySelector<HTMLElement>("#catalogue-selection")
  const selectionName = document.querySelector<HTMLElement>("#catalogue-selected-name")
  if (selection) selection.hidden = !booking.piece
  if (selectionName) selectionName.textContent = booking.piece?.name ?? ""
}

function resetFilters(): void {
  Object.assign(filters, createInitialFilters())
  refreshCatalogue()
}

function updateAfterChange(): void {
  persistBooking()
  updateBooking(booking, currentStep)
  if (Object.keys(errors).length > 0) {
    errors = validateBooking(booking, currentStep)
    renderBookingErrors(errors)
  }
  const confirmation = document.querySelector<HTMLElement>("#booking-confirmation")
  if (confirmation) confirmation.hidden = true
  if (currentStep === 4) {
    const button = document.querySelector<HTMLButtonElement>("#next-step")
    if (button) button.innerHTML = 'Valider mon récapitulatif <span aria-hidden="true">→</span>'
  }
}

function selectPiece(id: number): void {
  const piece = pieces.find((item) => item.id === id && item.available)
  if (!piece) return
  booking.piece = piece
  updateAfterChange()
  refreshCatalogue()
  announce(`${piece.name} sélectionné. Votre estimation a été mise à jour.`)
}

function changePeople(change: number): void {
  booking.people = Math.min(maxPeople, Math.max(1, booking.people + change))
  const slot = slots.find((item) => item.time === booking.time)
  if (slot && !canBookSlot(slot, booking.people)) {
    booking.time = ""
    announce("Le créneau choisi n’a pas assez de places. Choisissez une autre heure pour votre groupe.")
  }
  updateAfterChange()
}

function goToStep(step: BookingStep): void {
  currentStep = step
  errors = {}
  renderBooking(booking, step)
  document.querySelector<HTMLElement>("#booking-panel")?.focus({ preventScroll: true })
  announce(`Étape ${step} sur 4.`)
}

function submitStep(event: SubmitEvent): void {
  event.preventDefault()
  errors = validateBooking(booking, currentStep)
  if (Object.keys(errors).length > 0) {
    if (currentStep === 4) {
      const firstStep: BookingStep = errors.date || errors.time || errors.people ? 1 : errors.piece ? 2 : 3
      goToStep(firstStep)
      errors = validateBooking(booking, firstStep)
    }
    renderBookingErrors(errors)
    focusFirstError(errors)
    announce("Vérifiez les champs indiqués avant de poursuivre.")
    return
  }
  if (currentStep === 4) {
    const saved = persistBooking()
    const confirmation = document.querySelector<HTMLElement>("#booking-confirmation")
    const button = document.querySelector<HTMLButtonElement>("#next-step")
    if (confirmation) {
      const message = confirmation.querySelector("p")
      if (message) message.textContent = saved
        ? "Il est conservé dans ce navigateur. Aucune réservation n’a été envoyée au café."
        : "Gardez cette page ouverte pour conserver vos choix. Aucune réservation n’a été envoyée au café."
      confirmation.hidden = false
    }
    if (button) {
      button.disabled = true
      button.textContent = "Récapitulatif validé ✓"
    }
    announce("Votre récapitulatif est validé dans ce navigateur. Aucune réservation n’a été envoyée.")
    return
  }
  const nextStep: BookingStep = currentStep === 1 ? 2 : currentStep === 2 ? 3 : 4
  if (currentStep === 3) {
    booking.firstName = booking.firstName.trim()
    booking.email = booking.email.trim()
    persistBooking()
  }
  goToStep(nextStep)
}

function resetBooking(): void {
  const cleared = clearSavedBooking()
  booking = createInitialBooking()
  currentStep = 1
  errors = {}
  renderBooking(booking, currentStep)
  refreshCatalogue()
  const status = document.querySelector<HTMLElement>("#storage-status")
  if (status) status.textContent = cleared ? "Votre brouillon a été effacé." : "Le navigateur n’a pas permis d’effacer le brouillon sauvegardé."
  announce("La réservation a été réinitialisée.")
}

function setupFilters(): void {
  document.querySelector<HTMLElement>("#catalogue-filters")?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest<HTMLButtonElement>("[data-difficulty]")
    const difficulty = button?.dataset.difficulty
    if (difficulty === "Tous" || difficulty === "Débutant" || difficulty === "Intermédiaire") {
      filters.difficulty = difficulty
      refreshCatalogue()
      document.querySelector<HTMLButtonElement>(`[data-difficulty="${difficulty}"]`)?.focus({ preventScroll: true })
    }
  })
  document.querySelector<HTMLSelectElement>("#category-filter")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return
    const value = event.target.value
    const category = pieces.find((piece) => piece.category === value)?.category
    filters.category = category ?? "Tous"
    refreshCatalogue()
  })
  document.querySelector<HTMLSelectElement>("#availability-filter")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return
    const value = event.target.value
    if (value === "Toutes" || value === "Disponibles" || value === "Indisponibles") filters.availability = value
    refreshCatalogue()
  })
  document.querySelector<HTMLSelectElement>("#sort-filter")?.addEventListener("change", (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return
    const value = event.target.value
    if (value === "default" || value === "price-asc" || value === "price-desc") filters.sort = value
    refreshCatalogue()
  })
  document.querySelector<HTMLButtonElement>("#favorites-filter")
  ?.addEventListener("click", () => {
    filters.favoritesOnly = !filters.favoritesOnly
    refreshCatalogue()
  })
  document.querySelector<HTMLButtonElement>("#clear-favorites")
  ?.addEventListener("click", () => {
    clearFavorites()
    refreshCatalogue()
  })
}

function setupPieceSelection(): void {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return
    const favoriteButton =
      event.target.closest<HTMLButtonElement>("[data-favorite-id]")
    if (favoriteButton) {
      const id = Number(favoriteButton.dataset.favoriteId)
      toggleFavorite(id)
      refreshCatalogue()
      return
    }
    const detailsButton = event.target.closest<HTMLButtonElement>("[data-details-id]")
    if (detailsButton) {
      const id = Number(detailsButton.dataset.detailsId)
      const piece = getPieceById(id)
      if (piece){
        const dialog = document.querySelector<HTMLDialogElement>("#piece-dialog")
        const title = document.querySelector<HTMLDialogElement>("#piece-dialog-title")
        const description = document.querySelector<HTMLDialogElement>("#piece-dialog-description")
        const price = document.querySelector<HTMLDialogElement>("#piece-dialog-price")
        if (dialog) {
          dialog.showModal()
        }
        if (title) {
          title.textContent = piece.name
        }
        if (description) {
          description.textContent = piece.description
        }
        if (price) {
          price.textContent = formatPrice(piece.price)
        }
      }
      return
    }
    if (event.target.closest("[data-reset-filters]")) {
      resetFilters()
      document.querySelector<HTMLButtonElement>('[data-difficulty="Tous"]')?.focus({ preventScroll: true })
      return
    }
    const button = event.target.closest<HTMLButtonElement>("[data-piece-id]")
    // Le clic sur la photo ou le texte d’une carte active son vrai bouton.
    const cardButton = event.target.closest<HTMLElement>(".piece-card")?.querySelector<HTMLButtonElement>("[data-piece-id]")
    const selectedButton = button ?? cardButton
    if (!selectedButton || selectedButton.disabled) return
    const id = Number(selectedButton.dataset.pieceId)
    const inBooking = Boolean(selectedButton.closest("#booking-form"))
    selectPiece(id)
    const container = inBooking ? "#booking-pieces" : "#pieces"
    document.querySelector<HTMLButtonElement>(`${container} [data-piece-id="${id}"]`)?.focus({ preventScroll: true })
  })
}

function setupBooking(): void {
  const form = document.querySelector<HTMLFormElement>("#booking-form")
  form?.addEventListener("submit", submitStep)
  form?.addEventListener("input", (event) => {
    if (!(event.target instanceof HTMLInputElement)) return
    const input = event.target
    if (input.name === "date") {
      booking.date = input.value
      booking.time = ""
    }
    if (input.name === "firstName") booking.firstName = input.value
    if (input.name === "email") booking.email = input.value
    updateAfterChange()
  })
  form?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest<HTMLButtonElement>("button")
    if (!button || button.disabled) return
    if (button.id === "increase-people") changePeople(1)
    if (button.id === "decrease-people") changePeople(-1)
    if (button.id === "previous-step") goToStep(currentStep === 4 ? 3 : currentStep === 3 ? 2 : 1)
    const step = Number(button.dataset.step)
    if ((step === 1 || step === 2 || step === 3 || step === 4) && step < currentStep) goToStep(step)
    const slot = slots.find((item) => item.time === button.dataset.time)
    if (slot && canBookSlot(slot, booking.people)) {
      booking.time = slot.time
      updateAfterChange()
      document.querySelector<HTMLButtonElement>(`[data-time="${slot.time}"]`)?.focus({ preventScroll: true })
    }
  })
  document.querySelector<HTMLButtonElement>("#reset-booking")?.addEventListener("click", resetBooking)
}

function setupFaq(): void {
  const questions = document.querySelectorAll<HTMLButtonElement>(".faq-question")
  questions.forEach((button) => {
    button.addEventListener("click", () => {
      const shouldOpen = button.getAttribute("aria-expanded") !== "true"
      questions.forEach((question) => {
        const open = question === button && shouldOpen
        question.setAttribute("aria-expanded", String(open))
        const answer = document.getElementById(question.getAttribute("aria-controls") ?? "")
        if (answer) answer.hidden = !open
      })
    })
  })
}

function setupNavigation(): void {
  const menu = document.querySelector<HTMLButtonElement>("#menu-toggle")
  const navigation = document.querySelector<HTMLElement>("#main-navigation")
  function closeMenu(): void {
    menu?.setAttribute("aria-expanded", "false")
    menu?.setAttribute("aria-label", "Ouvrir le menu")
    navigation?.classList.remove("open")
  }
  menu?.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true"
    menu.setAttribute("aria-expanded", String(open))
    menu.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu")
    navigation?.classList.toggle("open", open)
  })
  navigation?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) closeMenu()
  })
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.getAttribute("aria-expanded") === "true") {
      closeMenu()
      menu.focus()
    }
  })
}

function setupImageFallback(): void {
  document.addEventListener("error", (event) => {
    const image = event.target
    if (!(image instanceof HTMLImageElement) || image.dataset.fallback === "true") return
    image.dataset.fallback = "true"
    image.src = "/images/atelier-shelf.jpg"
  }, true)
}

function setupPieceDialog(): void {
  const dialog = document.querySelector<HTMLDialogElement>("#piece-dialog")
  const closeButton = document.querySelector<HTMLButtonElement>("#close-piece-dialog")
  closeButton?.addEventListener("click", () => {
    dialog?.close()
  })
}

setupImageFallback()
setupFilters()
setupPieceSelection()
setupBooking()
setupFaq()
setupNavigation()
setupPieceDialog()
refreshCatalogue()
renderBooking(booking, currentStep)
