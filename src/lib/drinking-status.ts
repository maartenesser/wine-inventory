/**
 * Drinking status utility functions
 * Determines if a wine should be drunk now, is too young, or past its peak
 */

export type DrinkingStatus = 'drink-now' | 'drink-soon' | 'too-young' | 'past-peak' | 'unknown'

export interface DrinkingStatusInfo {
  status: DrinkingStatus
  label: string
  description: string
  urgency: number // 0-3, higher = more urgent to drink
}

/**
 * Parse a drinking window string and determine the wine's drinking status
 * @param drinkingWindow - e.g., "2024-2030", "Drink now", "2025-2035"
 * @returns DrinkingStatusInfo with status, label, and description
 */
export function getDrinkingStatus(drinkingWindow: string | null | undefined): DrinkingStatusInfo {
  if (!drinkingWindow) {
    return {
      status: 'unknown',
      label: 'Unknown',
      description: 'No drinking window specified',
      urgency: 0,
    }
  }

  const currentYear = new Date().getFullYear()
  const windowLower = drinkingWindow.toLowerCase().trim()

  // Check for "drink now" variations
  if (windowLower.includes('drink now') || windowLower.includes('ready') || windowLower.includes('anytime')) {
    return {
      status: 'drink-now',
      label: 'Drink now',
      description: 'Ready to enjoy',
      urgency: 2,
    }
  }

  // Try to parse year range like "2024-2030" or "2024 - 2030"
  const rangeMatch = drinkingWindow.match(/(\d{4})\s*[-–—]\s*(\d{4})/)
  if (rangeMatch) {
    const startYear = parseInt(rangeMatch[1])
    const endYear = parseInt(rangeMatch[2])

    if (currentYear < startYear) {
      const yearsToWait = startYear - currentYear
      return {
        status: 'too-young',
        label: 'Too young',
        description: `Wait ${yearsToWait} more year${yearsToWait > 1 ? 's' : ''} (from ${startYear})`,
        urgency: 0,
      }
    }

    if (currentYear > endYear) {
      const yearsOver = currentYear - endYear
      return {
        status: 'past-peak',
        label: 'Past peak',
        description: `${yearsOver} year${yearsOver > 1 ? 's' : ''} past optimal window`,
        urgency: 3, // Highest urgency - drink ASAP or may be too late
      }
    }

    // Within the window
    const yearsLeft = endYear - currentYear
    if (yearsLeft <= 1) {
      return {
        status: 'drink-soon',
        label: 'Drink soon',
        description: `Last year of optimal window`,
        urgency: 3,
      }
    }

    if (yearsLeft <= 2) {
      return {
        status: 'drink-soon',
        label: 'Drink soon',
        description: `${yearsLeft} years left in optimal window`,
        urgency: 2,
      }
    }

    return {
      status: 'drink-now',
      label: 'Drink now',
      description: `Optimal until ${endYear} (${yearsLeft} years)`,
      urgency: 1,
    }
  }

  // Try to parse single year like "2025" or "From 2025"
  const singleYearMatch = drinkingWindow.match(/(\d{4})/)
  if (singleYearMatch) {
    const year = parseInt(singleYearMatch[1])

    if (windowLower.includes('from') || windowLower.includes('after')) {
      // "From 2025" means wait until that year
      if (currentYear < year) {
        return {
          status: 'too-young',
          label: 'Too young',
          description: `Wait until ${year}`,
          urgency: 0,
        }
      }
      return {
        status: 'drink-now',
        label: 'Drink now',
        description: `Ready since ${year}`,
        urgency: 1,
      }
    }

    if (windowLower.includes('until') || windowLower.includes('before') || windowLower.includes('by')) {
      // "Until 2025" or "Before 2025" means drink before that year
      if (currentYear >= year) {
        return {
          status: 'past-peak',
          label: 'Past peak',
          description: `Should have been drunk by ${year}`,
          urgency: 3,
        }
      }
      const yearsLeft = year - currentYear
      if (yearsLeft <= 2) {
        return {
          status: 'drink-soon',
          label: 'Drink soon',
          description: `Drink before ${year}`,
          urgency: 2,
        }
      }
      return {
        status: 'drink-now',
        label: 'Drink now',
        description: `Best before ${year}`,
        urgency: 1,
      }
    }
  }

  // Couldn't parse, return unknown
  return {
    status: 'unknown',
    label: 'Unknown',
    description: drinkingWindow,
    urgency: 0,
  }
}

/**
 * Get badge color class based on drinking status
 */
export function getDrinkingStatusColor(status: DrinkingStatus): string {
  switch (status) {
    case 'drink-now':
      return 'bg-green-500 text-white'
    case 'drink-soon':
      return 'bg-orange-500 text-white'
    case 'too-young':
      return 'bg-blue-500 text-white'
    case 'past-peak':
      return 'bg-red-500 text-white'
    default:
      return 'bg-gray-400 text-white'
  }
}
