import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiWineExtraction } from '@/types/wine'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

// Quick extraction result - only essential fields for fast scanning
export interface QuickWineExtraction {
  chateau: string | null
  wine_name: string | null
  vintage: number | null
  region: string | null
  country: string | null
  color: 'red' | 'white' | 'rosé' | 'sparkling' | null
  grape_variety: string | null
  appellation: string | null
}

// FAST extraction prompt - only essential info, no background research
const QUICK_EXTRACTION_PROMPT = `Look at this wine bottle label and extract ONLY the basic information visible on the label.
Return ONLY valid JSON (no markdown, no code blocks):

{
  "chateau": "Producer/Chateau name from label",
  "wine_name": "Wine name if different from chateau, otherwise null",
  "vintage": 2020,
  "region": "Wine region if visible",
  "country": "Country if visible",
  "color": "red or white or rosé or sparkling",
  "grape_variety": "Grape variety if visible on label",
  "appellation": "Appellation if visible"
}

IMPORTANT:
- Only extract what you can clearly see on the label
- Be fast - don't research or infer, just read the label
- If something is not visible, set it to null
- Focus on chateau and vintage - these are most important`

/**
 * FAST extraction - only reads the label, no additional research
 * Use this for quick batch scanning
 */
export async function extractWineQuick(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<QuickWineExtraction> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) // Use faster model

  try {
    const result = await model.generateContent([
      QUICK_EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    // Clean up the response
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7)
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3)
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()

    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('Error in quick wine extraction:', error)
    throw new Error('Failed to extract wine information from image')
  }
}

const WINE_EXTRACTION_PROMPT = `Analyze this wine bottle label image and extract comprehensive wine information.
Return ONLY valid JSON with these fields (no markdown, no code blocks, just the JSON object):

{
  "chateau": "Producer/Chateau/Winery name",
  "wine_name": "Specific wine name if different from chateau, otherwise null",
  "vintage": 2020,
  "region": "Wine region (e.g., Bordeaux, Burgundy, Napa Valley, Rioja)",
  "appellation": "Specific appellation (e.g., Saint-Émilion Grand Cru, Pauillac)",
  "country": "Country of origin",
  "grape_variety": "Primary grape(s) - if not visible, infer from region (e.g., Bordeaux = Cabernet Sauvignon/Merlot blend)",
  "color": "red or white or rosé or sparkling",
  "alcohol_pct": 13.5,
  "winemaker_info": "Brief description of the château/winery - its history, reputation, style (2-3 sentences)",
  "food_pairing": ["grilled lamb", "aged cheese", "beef stew"],
  "tasting_notes": "Expected taste profile - body, tannins, fruit notes, finish",
  "drinking_window": "e.g., 2024-2030 or 'Drink now'",
  "confidence": {
    "chateau": 0.95,
    "vintage": 0.90,
    "region": 0.85
  }
}

IMPORTANT:
- Focus on accuracy for chateau/producer name and vintage year - these are the most critical fields
- For grape_variety: if not visible on label, infer from region (e.g., Burgundy red = Pinot Noir, Bordeaux = Cab/Merlot)
- For winemaker_info: use your knowledge of the producer to provide context
- For food_pairing: suggest 3-5 specific dishes that pair well
- For tasting_notes: describe what someone would expect when drinking this wine
- If a field is not visible AND cannot be inferred, set it to null
- Return ONLY the JSON object, no additional text or formatting`

export async function extractWineFromImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<GeminiWineExtraction> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  try {
    const result = await model.generateContent([
      WINE_EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    // Clean up the response - remove markdown code blocks if present
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7)
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3)
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()

    const extracted: GeminiWineExtraction = JSON.parse(cleanedText)

    return extracted
  } catch (error) {
    console.error('Error extracting wine info from image:', error)
    throw new Error('Failed to extract wine information from image')
  }
}

const FOOD_PAIRING_PROMPT = `Based on this wine information, suggest food pairings.
Wine: {chateau} {wine_name} {vintage}
Region: {region}
Grape: {grape_variety}
Color: {color}

Return ONLY valid JSON with these categories (no markdown, no code blocks):
{
  "ideal_pairings": ["dish1", "dish2", "dish3"],
  "meat": ["beef dish", "lamb dish"],
  "fish": ["fish dish"],
  "cheese": ["cheese type"],
  "vegetarian": ["vegetarian dish"]
}

Suggest practical, specific dishes that pair well with this wine style.`

export async function getFoodPairings(wine: {
  chateau: string
  wine_name?: string | null
  vintage?: number | null
  region?: string | null
  grape_variety?: string | null
  color?: string | null
}): Promise<{
  ideal_pairings: string[]
  meat: string[]
  fish: string[]
  cheese: string[]
  vegetarian: string[]
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = FOOD_PAIRING_PROMPT
    .replace('{chateau}', wine.chateau || '')
    .replace('{wine_name}', wine.wine_name || '')
    .replace('{vintage}', wine.vintage?.toString() || '')
    .replace('{region}', wine.region || '')
    .replace('{grape_variety}', wine.grape_variety || '')
    .replace('{color}', wine.color || '')

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Clean up the response
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7)
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.slice(3)
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3)
    }
    cleanedText = cleanedText.trim()

    return JSON.parse(cleanedText)
  } catch (error) {
    console.error('Error getting food pairings:', error)
    return {
      ideal_pairings: [],
      meat: [],
      fish: [],
      cheese: [],
      vegetarian: [],
    }
  }
}
