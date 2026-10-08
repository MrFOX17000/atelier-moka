import { pieces } from "../data/pieces.ts"
import type { CeramicPiece, PieceFilters } from "../types.ts"
import { isFavorite } from "../state/favorites.ts"

export function createInitialFilters(): PieceFilters {
  return { difficulty: "Tous", category: "Tous", availability: "Toutes", sort: "default", favoritesOnly: false, search: "" }
}

export function getFilteredPieces(filters: PieceFilters): CeramicPiece[] {
  const filtered = pieces.filter((piece) => {
    const matchesDifficulty = filters.difficulty === "Tous" || piece.difficulty === filters.difficulty
    const matchesCategory = filters.category === "Tous" || piece.category === filters.category
    const matchesAvailability = filters.availability === "Toutes"
      || (filters.availability === "Disponibles" ? piece.available : !piece.available)
    const matchesFavorites = filters.favoritesOnly === false ? true : isFavorite(piece.id)
    const matchesSearch = piece.name.toLowerCase().includes(filters.search.trim().toLowerCase())
    return matchesDifficulty && matchesCategory && matchesAvailability && matchesFavorites && matchesSearch
  })

  if (filters.sort === "price-asc") filtered.sort((a, b) => a.price - b.price)
  if (filters.sort === "price-desc") filtered.sort((a, b) => b.price - a.price)
  return filtered
}

export function renderFilters(filters: PieceFilters): void {
  document.querySelectorAll<HTMLButtonElement>("[data-difficulty]").forEach((button) => {
    const active = button.dataset.difficulty === filters.difficulty
    button.classList.toggle("active", active)
    button.setAttribute("aria-pressed", String(active))
  })
  const search = document.querySelector<HTMLInputElement>("#search-filter")
  const category = document.querySelector<HTMLSelectElement>("#category-filter")
  const availability = document.querySelector<HTMLSelectElement>("#availability-filter")
  const sort = document.querySelector<HTMLSelectElement>("#sort-filter")
  if (search) search.value = filters.search
  if (category) category.value = filters.category
  if (availability) availability.value = filters.availability
  if (sort) sort.value = filters.sort

  const button = document.querySelector<HTMLButtonElement>("#favorites-filter")

  if (button) {
    button.classList.toggle("active", filters.favoritesOnly)
    button.setAttribute("aria-pressed", String(filters.favoritesOnly))
  }
}
