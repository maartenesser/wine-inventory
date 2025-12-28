// Wine region coordinates for the interactive map
export interface WineRegion {
  name: string
  country: string
  lat: number
  lng: number
  color: string
  description: string
}

export const WINE_REGIONS: Record<string, WineRegion> = {
  // France
  'Bordeaux': { name: 'Bordeaux', country: 'France', lat: 44.8378, lng: -0.5792, color: '#722F37', description: 'Home of Cabernet Sauvignon and Merlot blends' },
  'Burgundy': { name: 'Burgundy', country: 'France', lat: 47.0522, lng: 4.3842, color: '#8B0000', description: 'Famous for Pinot Noir and Chardonnay' },
  'Bourgogne': { name: 'Burgundy', country: 'France', lat: 47.0522, lng: 4.3842, color: '#8B0000', description: 'Famous for Pinot Noir and Chardonnay' },
  'Champagne': { name: 'Champagne', country: 'France', lat: 49.0417, lng: 4.0000, color: '#FFD700', description: 'The only true Champagne region' },
  'Rhône': { name: 'Rhône Valley', country: 'France', lat: 44.1333, lng: 4.8000, color: '#8B4513', description: 'Syrah and Grenache country' },
  'Rhone': { name: 'Rhône Valley', country: 'France', lat: 44.1333, lng: 4.8000, color: '#8B4513', description: 'Syrah and Grenache country' },
  'Loire': { name: 'Loire Valley', country: 'France', lat: 47.3833, lng: 0.6833, color: '#98FB98', description: 'Known for Sauvignon Blanc and Chenin Blanc' },
  'Alsace': { name: 'Alsace', country: 'France', lat: 48.3167, lng: 7.4417, color: '#90EE90', description: 'Riesling and Gewürztraminer specialists' },
  'Provence': { name: 'Provence', country: 'France', lat: 43.5283, lng: 5.4497, color: '#FFB6C1', description: 'Rosé wine paradise' },
  'Languedoc': { name: 'Languedoc', country: 'France', lat: 43.6108, lng: 3.8767, color: '#A52A2A', description: 'France\'s largest wine region' },
  'Saint-Émilion': { name: 'Saint-Émilion', country: 'France', lat: 44.8944, lng: -0.1554, color: '#722F37', description: 'Premium Merlot-based wines' },
  'Pauillac': { name: 'Pauillac', country: 'France', lat: 45.2000, lng: -0.7500, color: '#722F37', description: 'Home to three First Growths' },
  'Margaux': { name: 'Margaux', country: 'France', lat: 45.0389, lng: -0.6750, color: '#722F37', description: 'Elegant Bordeaux wines' },

  // Italy
  'Tuscany': { name: 'Tuscany', country: 'Italy', lat: 43.4500, lng: 11.2500, color: '#DC143C', description: 'Sangiovese and Super Tuscans' },
  'Piedmont': { name: 'Piedmont', country: 'Italy', lat: 44.6900, lng: 7.9300, color: '#8B0000', description: 'Barolo and Barbaresco' },
  'Piemonte': { name: 'Piedmont', country: 'Italy', lat: 44.6900, lng: 7.9300, color: '#8B0000', description: 'Barolo and Barbaresco' },
  'Veneto': { name: 'Veneto', country: 'Italy', lat: 45.7333, lng: 11.8500, color: '#FFD700', description: 'Prosecco and Amarone' },
  'Sicily': { name: 'Sicily', country: 'Italy', lat: 37.5994, lng: 14.0154, color: '#B22222', description: 'Nero d\'Avola and volcanic wines' },
  'Sicilia': { name: 'Sicily', country: 'Italy', lat: 37.5994, lng: 14.0154, color: '#B22222', description: 'Nero d\'Avola and volcanic wines' },

  // Spain
  'Rioja': { name: 'Rioja', country: 'Spain', lat: 42.4650, lng: -2.4500, color: '#8B0000', description: 'Spain\'s most famous red wine region' },
  'Ribera del Duero': { name: 'Ribera del Duero', country: 'Spain', lat: 41.6500, lng: -3.7000, color: '#722F37', description: 'Powerful Tempranillo wines' },
  'Priorat': { name: 'Priorat', country: 'Spain', lat: 41.2000, lng: 0.7500, color: '#4B0082', description: 'Intense wines from slate soils' },
  'Rías Baixas': { name: 'Rías Baixas', country: 'Spain', lat: 42.4333, lng: -8.6500, color: '#98FB98', description: 'Albariño white wines' },

  // Germany
  'Mosel': { name: 'Mosel', country: 'Germany', lat: 49.9667, lng: 7.1167, color: '#90EE90', description: 'Steep slopes, world-class Riesling' },
  'Rheingau': { name: 'Rheingau', country: 'Germany', lat: 50.0167, lng: 8.0500, color: '#98FB98', description: 'Premium German Riesling' },
  'Pfalz': { name: 'Pfalz', country: 'Germany', lat: 49.4500, lng: 8.1500, color: '#90EE90', description: 'Germany\'s second largest region' },

  // Portugal
  'Douro': { name: 'Douro', country: 'Portugal', lat: 41.1833, lng: -7.8000, color: '#8B0000', description: 'Port wine and premium reds' },
  'Alentejo': { name: 'Alentejo', country: 'Portugal', lat: 38.5667, lng: -7.9000, color: '#B22222', description: 'Rich, full-bodied reds' },

  // Austria
  'Wachau': { name: 'Wachau', country: 'Austria', lat: 48.3833, lng: 15.4167, color: '#98FB98', description: 'Grüner Veltliner and Riesling' },

  // Switzerland
  'Valais': { name: 'Valais', country: 'Switzerland', lat: 46.2333, lng: 7.3500, color: '#90EE90', description: 'Alpine wines, Fendant' },
  'Geneva': { name: 'Geneva', country: 'Switzerland', lat: 46.2044, lng: 6.1432, color: '#98FB98', description: 'Swiss wine country' },

  // USA
  'Napa Valley': { name: 'Napa Valley', country: 'USA', lat: 38.5025, lng: -122.2654, color: '#722F37', description: 'Premium Cabernet Sauvignon' },
  'Napa': { name: 'Napa Valley', country: 'USA', lat: 38.5025, lng: -122.2654, color: '#722F37', description: 'Premium Cabernet Sauvignon' },
  'Sonoma': { name: 'Sonoma', country: 'USA', lat: 38.4913, lng: -122.7244, color: '#8B4513', description: 'Diverse varietals and styles' },
  'Willamette Valley': { name: 'Willamette Valley', country: 'USA', lat: 44.9429, lng: -123.0351, color: '#DC143C', description: 'Oregon Pinot Noir' },

  // Argentina
  'Mendoza': { name: 'Mendoza', country: 'Argentina', lat: -32.8833, lng: -68.8333, color: '#722F37', description: 'World capital of Malbec' },

  // Chile
  'Maipo Valley': { name: 'Maipo Valley', country: 'Chile', lat: -33.7833, lng: -70.5833, color: '#8B0000', description: 'Premium Chilean Cabernet' },
  'Maipo': { name: 'Maipo Valley', country: 'Chile', lat: -33.7833, lng: -70.5833, color: '#8B0000', description: 'Premium Chilean Cabernet' },
  'Colchagua': { name: 'Colchagua', country: 'Chile', lat: -34.4167, lng: -71.2167, color: '#722F37', description: 'Red wine paradise' },
  'Casablanca': { name: 'Casablanca', country: 'Chile', lat: -33.3167, lng: -71.4000, color: '#98FB98', description: 'Cool climate whites' },

  // Australia
  'Barossa Valley': { name: 'Barossa Valley', country: 'Australia', lat: -34.5500, lng: 138.9500, color: '#8B0000', description: 'Bold Shiraz' },
  'Barossa': { name: 'Barossa Valley', country: 'Australia', lat: -34.5500, lng: 138.9500, color: '#8B0000', description: 'Bold Shiraz' },
  'Margaret River': { name: 'Margaret River', country: 'Australia', lat: -33.9500, lng: 115.0667, color: '#722F37', description: 'Premium Cabernet and Chardonnay' },
  'Yarra Valley': { name: 'Yarra Valley', country: 'Australia', lat: -37.7333, lng: 145.5333, color: '#DC143C', description: 'Cool climate Pinot Noir' },

  // New Zealand
  'Marlborough': { name: 'Marlborough', country: 'New Zealand', lat: -41.5167, lng: 173.9500, color: '#90EE90', description: 'World-famous Sauvignon Blanc' },
  'Central Otago': { name: 'Central Otago', country: 'New Zealand', lat: -45.0000, lng: 169.0000, color: '#DC143C', description: 'Southernmost Pinot Noir' },

  // South Africa
  'Stellenbosch': { name: 'Stellenbosch', country: 'South Africa', lat: -33.9321, lng: 18.8602, color: '#722F37', description: 'Cape\'s premier wine region' },
  'Constantia': { name: 'Constantia', country: 'South Africa', lat: -34.0333, lng: 18.4333, color: '#FFD700', description: 'Historic sweet wines' },
}

// Get region from wine region name (with fuzzy matching)
export function findWineRegion(regionName: string | null): WineRegion | null {
  if (!regionName) return null

  // Direct match
  if (WINE_REGIONS[regionName]) {
    return WINE_REGIONS[regionName]
  }

  // Case-insensitive match
  const lowerRegion = regionName.toLowerCase()
  for (const [key, region] of Object.entries(WINE_REGIONS)) {
    if (key.toLowerCase() === lowerRegion || region.name.toLowerCase() === lowerRegion) {
      return region
    }
  }

  // Partial match
  for (const [key, region] of Object.entries(WINE_REGIONS)) {
    if (lowerRegion.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerRegion)) {
      return region
    }
  }

  return null
}

// Country coordinates for fallback
export const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'France': { lat: 46.2276, lng: 2.2137 },
  'Italy': { lat: 41.8719, lng: 12.5674 },
  'Spain': { lat: 40.4637, lng: -3.7492 },
  'Germany': { lat: 51.1657, lng: 10.4515 },
  'Portugal': { lat: 39.3999, lng: -8.2245 },
  'Austria': { lat: 47.5162, lng: 14.5501 },
  'Switzerland': { lat: 46.8182, lng: 8.2275 },
  'USA': { lat: 37.0902, lng: -95.7129 },
  'Argentina': { lat: -38.4161, lng: -63.6167 },
  'Chile': { lat: -35.6751, lng: -71.5430 },
  'Australia': { lat: -25.2744, lng: 133.7751 },
  'New Zealand': { lat: -40.9006, lng: 174.8860 },
  'South Africa': { lat: -30.5595, lng: 22.9375 },
}
