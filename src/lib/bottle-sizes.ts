// Wine bottle sizes with their volumes and display names
export interface BottleSize {
  id: string
  name: string
  volume: string      // Display volume (e.g., "750ml", "1.5L")
  volumeMl: number    // Volume in milliliters
  equivalent: number  // Equivalent number of standard bottles
  description?: string
}

export const BOTTLE_SIZES: BottleSize[] = [
  {
    id: 'piccolo',
    name: 'Piccolo / Split',
    volume: '187.5ml',
    volumeMl: 187.5,
    equivalent: 0.25,
    description: 'Quarter bottle, single glass serving'
  },
  {
    id: 'half',
    name: 'Half / Demi',
    volume: '375ml',
    volumeMl: 375,
    equivalent: 0.5,
    description: 'Half bottle'
  },
  {
    id: 'standard',
    name: 'Standard',
    volume: '750ml',
    volumeMl: 750,
    equivalent: 1,
    description: 'Regular bottle'
  },
  {
    id: 'magnum',
    name: 'Magnum',
    volume: '1.5L',
    volumeMl: 1500,
    equivalent: 2,
    description: '2 standard bottles'
  },
  {
    id: 'double_magnum',
    name: 'Double Magnum / Jeroboam',
    volume: '3L',
    volumeMl: 3000,
    equivalent: 4,
    description: '4 standard bottles (Jeroboam for Bordeaux)'
  },
  {
    id: 'rehoboam',
    name: 'Rehoboam',
    volume: '4.5L',
    volumeMl: 4500,
    equivalent: 6,
    description: '6 standard bottles'
  },
  {
    id: 'imperial',
    name: 'Imperial / Methuselah',
    volume: '6L',
    volumeMl: 6000,
    equivalent: 8,
    description: '8 standard bottles (Methuselah for Champagne)'
  },
  {
    id: 'salmanazar',
    name: 'Salmanazar',
    volume: '9L',
    volumeMl: 9000,
    equivalent: 12,
    description: '12 standard bottles (1 case)'
  },
  {
    id: 'balthazar',
    name: 'Balthazar',
    volume: '12L',
    volumeMl: 12000,
    equivalent: 16,
    description: '16 standard bottles'
  },
  {
    id: 'nebuchadnezzar',
    name: 'Nebuchadnezzar',
    volume: '15L',
    volumeMl: 15000,
    equivalent: 20,
    description: '20 standard bottles'
  },
  {
    id: 'solomon',
    name: 'Solomon',
    volume: '18L',
    volumeMl: 18000,
    equivalent: 24,
    description: '24 standard bottles (2 cases)'
  },
  {
    id: 'melchizedek',
    name: 'Melchizedek / Midas',
    volume: '30L',
    volumeMl: 30000,
    equivalent: 40,
    description: '40 standard bottles'
  },
]

// Get bottle size by ID
export function getBottleSize(id: string): BottleSize | undefined {
  return BOTTLE_SIZES.find(size => size.id === id)
}

// Get default bottle size (standard 750ml)
export function getDefaultBottleSize(): BottleSize {
  return BOTTLE_SIZES.find(size => size.id === 'standard')!
}

// Format bottle size for display
export function formatBottleSize(id: string): string {
  const size = getBottleSize(id)
  if (!size) return '750ml'
  return `${size.name} (${size.volume})`
}

// Get search term modifier for price lookups
export function getBottleSizeSearchTerm(id: string): string {
  const size = getBottleSize(id)
  if (!size || size.id === 'standard') return ''

  // Return search-friendly terms for price lookups
  switch (size.id) {
    case 'half':
      return 'half bottle 375ml'
    case 'magnum':
      return 'magnum 1.5L'
    case 'double_magnum':
      return 'double magnum 3L'
    case 'imperial':
      return 'imperial 6L'
    default:
      return `${size.name} ${size.volume}`
  }
}
