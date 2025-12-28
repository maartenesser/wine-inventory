import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GeminiWineExtraction } from '@/types/wine'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

const WINE_EXTRACTION_PROMPT = `Analyze this wine bottle label image and extract the following information.
Return ONLY valid JSON with these fields (no markdown, no code blocks, just the JSON object):

{
  "chateau": "Producer/Chateau/Winery name",
  "wine_name": "Specific wine name if different from chateau, otherwise null",
  "vintage": 2020,
  "region": "Wine region (e.g., Bordeaux, Burgundy, Napa Valley, Rioja)",
  "appellation": "Specific appellation (e.g., Saint-Émilion Grand Cru, Pauillac)",
  "country": "Country of origin",
  "grape_variety": "Primary grape(s) if visible (e.g., Cabernet Sauvignon, Merlot)",
  "color": "red or white or rosé or sparkling",
  "alcohol_pct": 13.5,
  "confidence": {
    "chateau": 0.95,
    "vintage": 0.90,
    "region": 0.85
  }
}

IMPORTANT:
- Focus on accuracy for chateau/producer name and vintage year - these are the most critical fields
- If a field is not visible or unclear, set it to null
- For vintage, only include if you can clearly read the year on the label
- Return ONLY the JSON object, no additional text or formatting`

export async function extractWineFromImage(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<GeminiWineExtraction> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
