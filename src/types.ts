export type Difficulty = "Débutant" | "Intermédiaire"
export type Category = "Tasse" | "Bol" | "Assiette" | "Mug" | "Vase" | "Cache-pot"

export type CeramicPiece = {
  id: number
  name: string
  price: number
  difficulty: Difficulty
  category: Category
  image: string
  description: string
  estimatedDuration: string
  available: boolean
  featured: boolean
}

export type PieceFilters = {
  difficulty: Difficulty | "Tous"
  category: Category | "Tous"
  availability: "Toutes" | "Disponibles" | "Indisponibles"
  sort: "default" | "price-asc" | "price-desc"
  favoritesOnly: boolean
}

export type TimeSlot = {
  time: string
  remainingPlaces: number
  available: boolean
}

export type Booking = {
  people: number
  piece: CeramicPiece | null
  date: string
  time: string
  firstName: string
  email: string
}

export type BookingStep = 1 | 2 | 3 | 4
export type BookingField = "people" | "piece" | "date" | "time" | "firstName" | "email"
export type BookingErrors = Partial<Record<BookingField, string>>