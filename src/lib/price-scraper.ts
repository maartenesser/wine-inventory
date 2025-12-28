import * as cheerio from 'cheerio'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { PriceResult } from '@/types/wine'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

/**
 * Main function to get wine price from multiple sources
 * Priority: Vivino Scraping > Google + Gemini estimation
 */
export async function getWinePrice(
  chateau: string,
  vintage?: number | null,
  region?: string | null
): Promise<PriceResult> {
  const searchQuery = buildSearchQuery(chateau, vintage, region)

  // Try Vivino first (free, no API key needed)
  try {
    const vivinoResult = await scrapeVivinoPrice(searchQuery)
    if (vivinoResult.price_avg) {
      return vivinoResult
    }
  } catch (error) {
    console.log('Vivino scraping failed, trying Gemini fallback:', error)
  }

  // Fallback: Use Gemini to estimate price based on wine knowledge
  try {
    const geminiResult = await estimatePriceWithGemini(chateau, vintage, region)
    if (geminiResult.price_avg) {
      return geminiResult
    }
  } catch (error) {
    console.log('Gemini price estimation failed:', error)
  }

  // Return null if no price found
  return {
    price_min: null,
    price_max: null,
    price_avg: null,
    source: null,
    currency: 'EUR',
  }
}

function buildSearchQuery(chateau: string, vintage?: number | null, region?: string | null): string {
  let query = chateau
  if (vintage) {
    query += ` ${vintage}`
  }
  if (region) {
    query += ` ${region}`
  }
  return query.trim()
}

/**
 * Scrape wine price from Vivino search results
 */
async function scrapeVivinoPrice(query: string): Promise<PriceResult> {
  const encodedQuery = encodeURIComponent(query)
  const url = `https://www.vivino.com/search/wines?q=${encodedQuery}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  })

  if (!response.ok) {
    throw new Error(`Vivino request failed: ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)

  const prices: number[] = []

  // Look for price elements - Vivino uses various classes
  // Try multiple selectors to find prices
  const priceSelectors = [
    '[class*="price"]',
    '[class*="Price"]',
    '[data-testid*="price"]',
    '.wine-price-value',
    '.addToCartButton__price',
  ]

  for (const selector of priceSelectors) {
    $(selector).each((_, el) => {
      const text = $(el).text()
      // Extract EUR price - look for patterns like "€12.99" or "12,99 €" or "EUR 12.99"
      const priceMatches = text.match(/(?:€|EUR)\s*(\d+[.,]?\d*)|(\d+[.,]\d{2})\s*(?:€|EUR)/gi)
      if (priceMatches) {
        for (const match of priceMatches) {
          const numStr = match.replace(/[€EUR\s]/gi, '').replace(',', '.')
          const price = parseFloat(numStr)
          if (price > 0 && price < 10000) {
            prices.push(price)
          }
        }
      }
    })
  }

  // Also try to find any text with € symbol
  $('*').each((_, el) => {
    const text = $(el).clone().children().remove().end().text()
    if (text.includes('€')) {
      const priceMatch = text.match(/€\s*(\d+[.,]?\d*)/g)
      if (priceMatch) {
        for (const match of priceMatch) {
          const numStr = match.replace('€', '').replace(',', '.').trim()
          const price = parseFloat(numStr)
          if (price > 2 && price < 10000 && !prices.includes(price)) {
            prices.push(price)
          }
        }
      }
    }
  })

  if (prices.length === 0) {
    return {
      price_min: null,
      price_max: null,
      price_avg: null,
      source: null,
      currency: 'EUR',
    }
  }

  // Remove duplicates and sort
  const uniquePrices = [...new Set(prices)].sort((a, b) => a - b)
  const avgPrice = uniquePrices.reduce((a, b) => a + b, 0) / uniquePrices.length

  return {
    price_min: uniquePrices[0],
    price_max: uniquePrices[uniquePrices.length - 1],
    price_avg: Math.round(avgPrice * 100) / 100,
    source: 'vivino',
    currency: 'EUR',
  }
}

/**
 * Use Gemini to estimate wine price based on its knowledge
 */
async function estimatePriceWithGemini(
  chateau: string,
  vintage?: number | null,
  region?: string | null
): Promise<PriceResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const wineDescription = [
    chateau,
    vintage ? `vintage ${vintage}` : '',
    region ? `from ${region}` : '',
  ].filter(Boolean).join(', ')

  const prompt = `You are a wine expert. Estimate the retail price in EUR for this wine:
${wineDescription}

Based on your knowledge of wine prices, provide a realistic price estimate.
Consider the producer's reputation, the region, the vintage quality, and typical market prices.

Return ONLY valid JSON (no markdown, no code blocks, just the JSON object):
{
  "price_min": 15.99,
  "price_max": 25.99,
  "price_avg": 19.99,
  "confidence": "medium",
  "reasoning": "Brief explanation"
}

If you don't know this wine well enough to estimate, return:
{
  "price_min": null,
  "price_max": null,
  "price_avg": null,
  "confidence": "low",
  "reasoning": "Unknown wine"
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text().trim()

    // Clean up response
    if (text.startsWith('```json')) {
      text = text.slice(7)
    } else if (text.startsWith('```')) {
      text = text.slice(3)
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }

    const parsed = JSON.parse(text.trim())

    // Only return if confidence is medium or high
    if (parsed.price_avg && parsed.confidence !== 'low') {
      return {
        price_min: parsed.price_min,
        price_max: parsed.price_max,
        price_avg: parsed.price_avg,
        source: 'google',
        currency: 'EUR',
      }
    }
  } catch (error) {
    console.error('Error with Gemini price estimation:', error)
  }

  return {
    price_min: null,
    price_max: null,
    price_avg: null,
    source: null,
    currency: 'EUR',
  }
}
