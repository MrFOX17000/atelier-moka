import type { CeramicPiece } from "../types.ts"
import { formatPrice } from "../utils/price.ts"
import { isFavorite } from "../state/favorites.ts"

export function renderPieces(container: HTMLElement, pieces: CeramicPiece[], selectedId?: number): void {
  if (pieces.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-symbol" aria-hidden="true">✳</span>
        <h3>Une autre envie ?</h3>
        <p>Aucune pièce ne correspond à ces filtres. Essayez une autre combinaison.</p>
        <button type="button" class="text-button" data-reset-filters>Réinitialiser les filtres <span aria-hidden="true">↗</span></button>
      </div>`
    return
  }

  container.innerHTML = pieces.map((piece) => {
    const selected = piece.id === selectedId
    const favorite = isFavorite(piece.id)
    return `
      <article class="piece-card ${selected ? "selected" : ""} ${!piece.available ? "unavailable" : ""}" data-category="${piece.category}">
        <div class="piece-visual">
          <button
            type="button"
            class="favorite-button"
            data-favorite-id="${piece.id}"
            aria-pressed="${favorite}"
            aria-label="${favorite ? "Retirer des favoris" : "Ajouter aux favoris"}"
          >
            ${favorite ? "♥" : "♡"}
          </button>
          <img src="${piece.image}" alt="${piece.name}, exemple de céramique décorée" loading="lazy" width="640" height="800">
          ${piece.featured ? '<span class="piece-badge">♡ Coup de cœur</span>' : ""}
          ${!piece.available ? '<span class="piece-badge unavailable-badge">Indisponible</span>' : ""}
          ${selected ? '<span class="selection-mark" aria-hidden="true">✓</span>' : ""}
        </div>
        <div class="piece-details">
          <div class="piece-heading"><span class="eyebrow">${piece.category}</span><span class="piece-price">${formatPrice(piece.price)}</span></div>
          <h3>${piece.name}</h3>
          <p class="piece-description">${piece.description}</p>
          <p class="piece-meta"><span>${piece.difficulty}</span><span aria-hidden="true">·</span><span>${piece.estimatedDuration}</span></p>
          <button type="button" class="piece-select" data-piece-id="${piece.id}" aria-pressed="${selected}" aria-label="${selected ? "Pièce choisie :" : "Choisir"} ${piece.name}" ${!piece.available ? "disabled" : ""}>
            ${!piece.available ? "Bientôt de retour" : selected ? "Pièce choisie" : "Choisir cette pièce"}<span aria-hidden="true">${selected ? "✓" : "↗"}</span>
          </button>
        </div>
      </article>`
  }).join("")
}
