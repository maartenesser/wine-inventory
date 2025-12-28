'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ImageUpload } from '@/components/camera/ImageUpload'
import { ArrowLeft, Check, Loader2, Wine, Plus, Minus, Euro } from 'lucide-react'
import { toast } from 'sonner'
import type { GeminiWineExtraction, PriceResult } from '@/types/wine'

export default function ScanPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scanResult, setScanResult] = useState<{
    wine: GeminiWineExtraction
    price: PriceResult | null
  } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [manualPrice, setManualPrice] = useState('')

  const handleImageCapture = async (file: File) => {
    setIsScanning(true)
    setScanResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setScanResult({
          wine: data.wine,
          price: data.price,
        })
        if (data.price?.price_avg) {
          setManualPrice(data.price.price_avg.toString())
        }
        toast.success('Wine label analyzed successfully!')
      } else {
        toast.error(data.error || 'Failed to analyze wine label')
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Failed to scan wine label')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSave = async () => {
    if (!scanResult?.wine.chateau) {
      toast.error('Wine name is required')
      return
    }

    setIsSaving(true)

    try {
      const priceAvg = manualPrice ? parseFloat(manualPrice) : scanResult.price?.price_avg

      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chateau: scanResult.wine.chateau,
          wine_name: scanResult.wine.wine_name,
          vintage: scanResult.wine.vintage,
          region: scanResult.wine.region,
          appellation: scanResult.wine.appellation,
          country: scanResult.wine.country,
          grape_variety: scanResult.wine.grape_variety,
          color: scanResult.wine.color,
          alcohol_pct: scanResult.wine.alcohol_pct,
          quantity,
          price_avg: priceAvg,
          price_min: scanResult.price?.price_min,
          price_max: scanResult.price?.price_max,
          price_source: priceAvg ? (scanResult.price?.source || 'manual') : null,
        }),
      })

      if (response.ok) {
        toast.success('Wine added to collection!')
        router.push('/')
      } else {
        toast.error('Failed to save wine')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save wine')
    } finally {
      setIsSaving(false)
    }
  }

  const getColorBadge = (color: string | null) => {
    if (!color) return null
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      white: 'bg-yellow-200 text-black',
      rosé: 'bg-pink-300 text-black',
      sparkling: 'bg-amber-200 text-black',
    }
    return (
      <Badge className={colorMap[color] || 'bg-gray-500'}>
        {color}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Wine className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Scan Wine</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Image upload */}
          <Card>
            <CardHeader>
              <CardTitle>1. Capture Wine Label</CardTitle>
              <CardDescription>
                Take a photo or upload an image of the wine bottle label
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload onImageCapture={handleImageCapture} isLoading={isScanning} />
            </CardContent>
          </Card>

          {/* Scan results */}
          {scanResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  2. Review Wine Details
                </CardTitle>
                <CardDescription>
                  Verify the extracted information and adjust if needed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wine info */}
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Chateau / Producer</label>
                    <p className="text-lg font-semibold">{scanResult.wine.chateau || 'Unknown'}</p>
                  </div>

                  {scanResult.wine.wine_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Wine Name</label>
                      <p>{scanResult.wine.wine_name}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {scanResult.wine.vintage && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Vintage</label>
                        <p className="font-semibold">{scanResult.wine.vintage}</p>
                      </div>
                    )}
                    {scanResult.wine.color && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Color</label>
                        <div className="mt-1">{getColorBadge(scanResult.wine.color)}</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {scanResult.wine.region && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Region</label>
                        <p>{scanResult.wine.region}</p>
                      </div>
                    )}
                    {scanResult.wine.country && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Country</label>
                        <p>{scanResult.wine.country}</p>
                      </div>
                    )}
                  </div>

                  {scanResult.wine.grape_variety && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Grape Variety</label>
                      <p>{scanResult.wine.grape_variety}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Price (EUR)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="max-w-32"
                    />
                    {scanResult.price?.source && (
                      <Badge variant="outline" className="ml-2">
                        from {scanResult.price.source}
                      </Badge>
                    )}
                  </div>
                  {scanResult.price?.price_min && scanResult.price?.price_max && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Price range: €{scanResult.price.price_min} - €{scanResult.price.price_max}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground ml-2">bottles</span>
                  </div>
                </div>

                <Separator />

                {/* Save button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSave}
                  disabled={isSaving || !scanResult.wine.chateau}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Add to Collection
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
