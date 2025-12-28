'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/camera/ImageUpload'
import { ArrowLeft, Check, Loader2, Wine, Plus, Minus, Euro, MapPin, GlassWater } from 'lucide-react'
import { toast } from 'sonner'
import type { GeminiWineExtraction, PriceResult } from '@/types/wine'
import { BOTTLE_SIZES, getBottleSize, type BottleSize } from '@/lib/bottle-sizes'

interface Location {
  id: string
  name: string
  description: string | null
}

// Coordinates for known locations
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Verbier': { lat: 46.0967, lng: 7.2286 },
  'Constance': { lat: 47.6633, lng: 9.1769 },
  'Brussels': { lat: 50.8503, lng: 4.3517 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export default function ScanPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scanResult, setScanResult] = useState<{
    wine: GeminiWineExtraction
    price: PriceResult | null
  } | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [bottleSize, setBottleSize] = useState<string>('standard')
  const [manualPrice, setManualPrice] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [newLocationName, setNewLocationName] = useState('')
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null)

  // Fetch locations and detect nearest one on mount
  useEffect(() => {
    fetchLocations()
    detectNearestLocation()
  }, [])

  const detectNearestLocation = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        // Find nearest location
        let nearestLocation = ''
        let minDistance = Infinity

        for (const [name, coords] of Object.entries(LOCATION_COORDINATES)) {
          const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng)
          if (distance < minDistance) {
            minDistance = distance
            nearestLocation = name
          }
        }

        // Set the nearest location after locations are loaded
        if (nearestLocation) {
          // Store it to apply after locations load
          setNearestLocationName(nearestLocation)
        }
      },
      (error) => {
        console.log('Geolocation not available:', error.message)
      },
      { timeout: 5000, enableHighAccuracy: false }
    )
  }

  const [nearestLocationName, setNearestLocationName] = useState<string>('')

  // Auto-select nearest location when both are available
  useEffect(() => {
    if (nearestLocationName && locations.length > 0 && !selectedLocation) {
      const matchingLocation = locations.find(loc => loc.name === nearestLocationName)
      if (matchingLocation) {
        setSelectedLocation(matchingLocation.id)
        toast.success(`Auto-selected ${nearestLocationName} based on your location`)
      }
    }
  }, [nearestLocationName, locations, selectedLocation])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (data.locations) {
        setLocations(data.locations)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return

    setIsAddingLocation(true)
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLocationName.trim() }),
      })

      const data = await response.json()
      if (data.location) {
        setLocations([...locations, data.location])
        setSelectedLocation(data.location.id)
        setNewLocationName('')
        toast.success('Location added!')
      }
    } catch (error) {
      console.error('Failed to add location:', error)
      toast.error('Failed to add location')
    } finally {
      setIsAddingLocation(false)
    }
  }

  const handleImageCapture = async (file: File) => {
    setIsScanning(true)
    setScanResult(null)

    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // Remove the data:image/xxx;base64, prefix for storage
        const base64Data = base64.split(',')[1]
        setCapturedImageData(base64Data)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('image', file)
      formData.append('bottle_size', bottleSize)

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
          bottle_size: bottleSize,
          quantity,
          price_avg: priceAvg,
          price_min: scanResult.price?.price_min,
          price_max: scanResult.price?.price_max,
          price_source: priceAvg ? (scanResult.price?.source || 'manual') : null,
          location_id: selectedLocation || null,
          image_data: capturedImageData,
          food_pairing: scanResult.wine.food_pairing,
          tasting_notes: scanResult.wine.tasting_notes,
          winemaker_info: scanResult.wine.winemaker_info,
          drinking_window: scanResult.wine.drinking_window,
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
          {/* Bottle size selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GlassWater className="h-5 w-5" />
                1. Select Bottle Size
              </CardTitle>
              <CardDescription>
                Choose the bottle size before scanning - this affects the price lookup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BOTTLE_SIZES.slice(0, 6).map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setBottleSize(size.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      bottleSize === size.id
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{size.name}</p>
                    <p className="text-xs text-muted-foreground">{size.volume}</p>
                  </button>
                ))}
              </div>
              {/* Show more sizes in a dropdown for rare formats */}
              {BOTTLE_SIZES.length > 6 && (
                <div className="mt-3">
                  <Select value={bottleSize} onValueChange={setBottleSize}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Or select a larger format..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BOTTLE_SIZES.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{size.name}</span>
                            <span className="text-muted-foreground ml-2">({size.volume})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Show selected bottle info */}
              {bottleSize && getBottleSize(bottleSize) && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getBottleSize(bottleSize)?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getBottleSize(bottleSize)?.description}
                      </p>
                    </div>
                    <Badge variant="secondary">{getBottleSize(bottleSize)?.volume}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image upload */}
          <Card>
            <CardHeader>
              <CardTitle>2. Capture Wine Label</CardTitle>
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
                  3. Review Wine Details
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

                  <div className="grid grid-cols-3 gap-4">
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
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bottle Size</label>
                      <p className="font-semibold">{getBottleSize(bottleSize)?.volume || '750ml'}</p>
                    </div>
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

                  {scanResult.wine.winemaker_info && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-muted-foreground">About the Producer</label>
                      <p className="text-sm mt-1">{scanResult.wine.winemaker_info}</p>
                    </div>
                  )}

                  {scanResult.wine.tasting_notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tasting Notes</label>
                      <p className="text-sm">{scanResult.wine.tasting_notes}</p>
                    </div>
                  )}

                  {scanResult.wine.food_pairing && scanResult.wine.food_pairing.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Food Pairing</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {scanResult.wine.food_pairing.map((food, idx) => (
                          <Badge key={idx} variant="secondary">{food}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {scanResult.wine.drinking_window && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Best Drinking Window</label>
                      <p className="text-sm font-medium">{scanResult.wine.drinking_window}</p>
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

                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Storage Location
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select location..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="Add new location..."
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddLocation}
                      disabled={isAddingLocation || !newLocationName.trim()}
                    >
                      {isAddingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
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
