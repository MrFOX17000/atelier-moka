import { pieces } from "../data/pieces.ts"
import { canBookSlot, maxPeople, slots } from "../data/slots.ts"
import type { Booking, BookingErrors, BookingStep } from "../types.ts"
import { formatBookingDate, getToday } from "../utils/date.ts"
import { calculateEstimatedPrice, formatPrice } from "../utils/price.ts"
import { isBookingComplete } from "../utils/validation.ts"

function renderSlotStep(): string {
  return `
    <div class="step-heading"><span class="eyebrow">Étape 01 / 04</span><h3>Un moment rien que pour vous.</h3><p>Choisissez votre date et venez en bonne compagnie.</p></div>
    <div class="slot-fields">
      <div class="form-field">
        <label for="booking-date">Date de votre atelier <span aria-hidden="true">*</span></label>
        <input id="booking-date" name="date" type="date" min="${getToday()}" max="9999-12-31" required aria-describedby="error-date">
        <p class="field-error" id="error-date" hidden></p>
      </div>
      <div class="form-field">
        <label for="people-count">Nombre de personnes <span aria-hidden="true">*</span></label>
        <div class="people-selector">
          <button type="button" id="decrease-people" aria-label="Retirer une personne">−</button>
          <output id="people-count" aria-live="polite"></output>
          <button type="button" id="increase-people" aria-label="Ajouter une personne">+</button>
        </div>
        <p class="field-hint">De 1 à ${maxPeople} personnes</p>
        <p class="field-error" id="error-people" hidden></p>
      </div>
    </div>
    <fieldset class="slot-fieldset" aria-describedby="error-time">
      <legend>Votre créneau <span aria-hidden="true">*</span></legend>
      <div class="time-slots" id="time-slots"></div>
      <p class="field-error" id="error-time" hidden></p>
    </fieldset>
    <p class="booking-note"><svg class="icon" aria-hidden="true"><use href="#icon-clock"></use></svg> Prévoyez 1 h 30 à 2 h pour peindre à votre rythme.</p>`
}

function renderPieceStep(): string {
  return `
    <div class="step-heading"><span class="eyebrow">Étape 02 / 04</span><h3>À chaque envie, sa pièce.</h3><p>Choisissez la pièce qui vous inspire. On s’occupe du reste.</p></div>
    <div class="booking-pieces" id="booking-pieces" role="group" aria-label="Pièce à peindre" aria-describedby="error-piece"></div>
    <p class="field-error" id="error-piece" hidden></p>
    <p class="field-hint">Les photos montrent des exemples décorés. Votre pièce sera vierge, prête pour vos idées.</p>`
}

function renderInformationStep(): string {
  return `
    <div class="step-heading"><span class="eyebrow">Étape 03 / 04</span><h3>Faisons connaissance.</h3><p>Quelques informations pour compléter votre récapitulatif.</p></div>
    <div class="information-fields">
      <div class="form-field">
        <label for="booking-firstName">Votre prénom <span aria-hidden="true">*</span></label>
        <input id="booking-firstName" name="firstName" type="text" autocomplete="given-name" maxlength="60" placeholder="Camille" required aria-describedby="error-firstName">
        <p class="field-error" id="error-firstName" hidden></p>
      </div>
      <div class="form-field">
        <label for="booking-email">Votre adresse email <span aria-hidden="true">*</span></label>
        <input id="booking-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="camille@exemple.fr" required aria-describedby="error-email">
        <p class="field-error" id="error-email" hidden></p>
      </div>
    </div>
    <p class="booking-note"><svg class="icon" aria-hidden="true"><use href="#icon-leaf"></use></svg> Ces informations restent sur cet appareil. Aucun email ne sera envoyé.</p>`
}

function renderSummaryStep(): string {
  return `
    <div class="step-heading"><span class="eyebrow">Étape 04 / 04</span><h3>Votre parenthèse créative.</h3><p>Tout est là. Prenez un instant pour vérifier vos choix.</p></div>
    <dl class="booking-recap">
      <div><dt>Date</dt><dd data-recap="date"></dd></div>
      <div><dt>Heure</dt><dd data-recap="time"></dd></div>
      <div><dt>Participants</dt><dd data-recap="people"></dd></div>
      <div><dt>Pièce</dt><dd data-recap="piece"></dd></div>
      <div><dt>Prix unitaire</dt><dd data-recap="unitPrice"></dd></div>
      <div><dt>Prénom</dt><dd data-recap="firstName"></dd></div>
      <div><dt>Email</dt><dd data-recap="email"></dd></div>
      <div class="recap-total"><dt>Total estimé</dt><dd data-recap="total"></dd></div>
    </dl>
    <p class="booking-note">Cette démonstration prépare votre réservation sans bloquer de table ni effectuer de paiement.</p>
    <div id="booking-confirmation" class="booking-confirmation" role="status" hidden>
      <span class="confirmation-check" aria-hidden="true">✓</span>
      <div><h4>Votre récapitulatif est validé !</h4><p>Il est conservé dans ce navigateur. Aucune réservation n’a été envoyée au café.</p></div>
    </div>`
}

export function renderBooking(booking: Booking, step: BookingStep): void {
  const container = document.querySelector<HTMLElement>("#booking-content")
  if (!container) return

  const steps = ["Créneau", "Pièce", "Informations", "Récapitulatif"]
  const content = step === 1 ? renderSlotStep()
    : step === 2 ? renderPieceStep()
    : step === 3 ? renderInformationStep()
    : renderSummaryStep()

  container.innerHTML = `
    <ol class="booking-progress" aria-label="Étapes de réservation">
      ${steps.map((label, index) => `
        <li class="${index + 1 === step ? "current" : index + 1 < step ? "completed" : ""}">
          <button type="button" data-step="${index + 1}" ${index + 1 > step ? "disabled" : ""} ${index + 1 === step ? 'aria-current="step"' : ""}>
            <span class="step-number" aria-hidden="true">${index + 1 < step ? "✓" : `0${index + 1}`}</span><span>${label}</span>
          </button>
        </li>`).join("")}
    </ol>
    <div class="booking-panel" id="booking-panel" tabindex="-1">${content}</div>
    <div class="booking-actions">
      ${step > 1 ? '<button type="button" class="text-button" id="previous-step"><span aria-hidden="true">←</span> Retour</button>' : '<span class="required-note">* Champs obligatoires</span>'}
      <button type="submit" class="button button-primary" id="next-step">${step === 4 ? "Valider mon récapitulatif" : "Étape suivante"}<span aria-hidden="true">→</span></button>
    </div>`

  const dateInput = document.querySelector<HTMLInputElement>("#booking-date")
  const firstNameInput = document.querySelector<HTMLInputElement>("#booking-firstName")
  const emailInput = document.querySelector<HTMLInputElement>("#booking-email")
  if (dateInput) dateInput.value = booking.date
  if (firstNameInput) firstNameInput.value = booking.firstName
  if (emailInput) emailInput.value = booking.email
  updateBooking(booking, step)
}

export function renderTimeSlots(booking: Booking): void {
  const container = document.querySelector<HTMLElement>("#time-slots")
  if (!container) return

  container.innerHTML = slots.map((slot) => {
    const available = canBookSlot(slot, booking.people)
    const selected = booking.time === slot.time
    const label = !slot.available || slot.remainingPlaces === 0 ? "Complet"
      : !available ? `${slot.remainingPlaces} places · groupe trop grand`
      : `${slot.remainingPlaces} places`

    return `<button type="button" class="time-slot ${selected ? "selected" : ""}" data-time="${slot.time}" aria-pressed="${selected}" ${!available ? "disabled" : ""}>
      <span>${slot.time}</span><small>${label}</small>
    </button>`
  }).join("")
}

function renderBookingPieces(booking: Booking): void {
  const container = document.querySelector<HTMLElement>("#booking-pieces")
  if (!container) return
  container.innerHTML = pieces.map((piece) => `
    <button type="button" class="booking-piece ${booking.piece?.id === piece.id ? "selected" : ""}" data-piece-id="${piece.id}" aria-pressed="${booking.piece?.id === piece.id}" ${!piece.available ? "disabled" : ""}>
      <img src="${piece.image}" alt="" loading="lazy" width="80" height="90">
      <span><strong>${piece.name}</strong><small>${piece.available ? `${formatPrice(piece.price)} · ${piece.difficulty}` : "Indisponible"}</small></span>
      <span class="booking-piece-check" aria-hidden="true">${booking.piece?.id === piece.id ? "✓" : "+"}</span>
    </button>`
  ).join("")
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) element.textContent = value
}

export function updateBooking(booking: Booking, step: BookingStep): void {
  setText("#people-count", String(booking.people))
  const decrease = document.querySelector<HTMLButtonElement>("#decrease-people")
  const increase = document.querySelector<HTMLButtonElement>("#increase-people")
  if (decrease) decrease.disabled = booking.people <= 1
  if (increase) increase.disabled = booking.people >= maxPeople
  if (step === 1) renderTimeSlots(booking)
  if (step === 2) renderBookingPieces(booking)

  const total = calculateEstimatedPrice(booking)
  setText("#summary-piece", booking.piece?.name ?? "Votre pièce à choisir")
  setText("#summary-unit-price", booking.piece ? formatPrice(booking.piece.price) : "—")
  setText("#summary-people", `${booking.people} ${booking.people > 1 ? "personnes" : "personne"}`)
  setText("#summary-date", formatBookingDate(booking.date))
  setText("#summary-time", booking.time || "À choisir")
  setText("#summary-total", booking.piece ? formatPrice(total) : "—")
  const summaryImage = document.querySelector<HTMLImageElement>("#summary-image")
  const imagePath = booking.piece?.image ?? "/images/atelier-shelf.jpg"
  if (summaryImage && summaryImage.getAttribute("src") !== imagePath) {
    summaryImage.src = imagePath
    summaryImage.alt = booking.piece?.name ?? "Céramiques de l’atelier"
  }

  if (step === 4) {
    setText('[data-recap="date"]', formatBookingDate(booking.date))
    setText('[data-recap="time"]', booking.time)
    setText('[data-recap="people"]', String(booking.people))
    setText('[data-recap="piece"]', booking.piece?.name ?? "À choisir")
    setText('[data-recap="unitPrice"]', formatPrice(booking.piece?.price ?? 0))
    // Les données saisies sont écrites avec textContent, jamais injectées dans du HTML.
    setText('[data-recap="firstName"]', booking.firstName)
    setText('[data-recap="email"]', booking.email)
    setText('[data-recap="total"]', formatPrice(total))
    const confirm = document.querySelector<HTMLButtonElement>("#next-step")
    if (confirm) confirm.disabled = !isBookingComplete(booking)
  }
}

export function renderBookingErrors(errors: BookingErrors): void {
  document.querySelectorAll<HTMLElement>(".field-error").forEach((element) => {
    element.textContent = ""
    element.hidden = true
  })
  document.querySelectorAll<HTMLElement>('#booking-form [aria-invalid="true"]').forEach((element) => element.removeAttribute("aria-invalid"))
  for (const [field, message] of Object.entries(errors)) {
    const error = document.querySelector<HTMLElement>(`#error-${field}`)
    if (!error || !message) continue
    error.textContent = message
    error.hidden = false
    const input = document.querySelector<HTMLElement>(`#booking-${field}`)
    const group = field === "time" ? document.querySelector<HTMLElement>(".slot-fieldset")
      : field === "piece" ? document.querySelector<HTMLElement>("#booking-pieces")
      : null
    input?.setAttribute("aria-invalid", "true")
    group?.setAttribute("aria-invalid", "true")
  }
}

export function focusFirstError(errors: BookingErrors): void {
  const field = Object.keys(errors)[0]
  const selector = field === "time" ? ".time-slot:not(:disabled)"
    : field === "piece" ? ".booking-piece:not(:disabled)"
    : field === "people" ? "#increase-people"
    : `#booking-${field}`
  document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
}
