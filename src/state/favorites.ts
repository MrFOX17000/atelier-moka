import { pieces } from "../data/pieces.ts"

const favoriteIds: number[] = []

export function isFavorite(id: number): boolean {
    return favoriteIds.includes(id)
}

export function toggleFavorite(id: number): void {
    if (!isValidFavoriteId(id)) return
    const position = favoriteIds.indexOf(id)
    if(position === -1){
        favoriteIds.push(id)
    }else {
        favoriteIds.splice(position, 1)
    }
    saveFavorites()
}

export function getFavoriteCount(): number{
    return favoriteIds.length
}

export function saveFavorites(): void {
    try {
        localStorage.setItem("atelier-moka-favorites", JSON.stringify(favoriteIds))
    } catch {
        console.log("Impossible d'ajouter le favori au localStorage")
    }
}

export function loadFavorites(): void {
    try {
        const saved = localStorage.getItem("atelier-moka-favorites")
        if (saved === null) return
        const parsed: unknown = JSON.parse(saved)
        if (!Array.isArray(parsed)) return
        for (const value of parsed) {
            if (isValidFavoriteId(value) && !favoriteIds.includes(value)) {
                favoriteIds.push(value)
            }
        }
        saveFavorites()
    } catch {
        console.log("Impossible de lire les favoris")
    }
}

export function clearFavorites(): void {
    favoriteIds.splice(0, favoriteIds.length)    
    saveFavorites()
}

function isValidFavoriteId(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && pieces.some((piece) => piece.id === value)
}

loadFavorites()
