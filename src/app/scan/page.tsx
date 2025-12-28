'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ImageUpload, type ImageUploadRef } from '@/components/camera/ImageUpload'
import { ArrowLeft, Check, Loader2, Wine, Plus, Minus, Euro, MapPin, GlassWater, Camera, Zap, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { GeminiWineExtraction, PriceResult } from '@/types/wine'
import { BOTTLE_SIZES, getBottleSize } from '@/lib/bottle-sizes'

interface Location {
  id: string
  name: string
  description: string | null
}

interface QuickWineResult {
  chateau: string | null
  wine_name: string | null
  vintage: number | null
  region: string | null
  country: string | null
  color: 'red' | 'white' | 'rosé' | 'sparkling' | null
  grape_variety: string | null
  appellation: string | null
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
  const [quickMode, setQuickMode] = useState(true) // Default to quick mode
  const [scanResult, setScanResult] = useState<{
    wine: GeminiWineExtraction
    price: PriceResult | null
  } | null>(null)
  const [quickResult, setQuickResult] = useState<QuickWineResult | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [bottleSize, setBottleSize] = useState<string>('standard')
  const [manualPrice, setManualPrice] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [newLocationName, setNewLocationName] = useState('')
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [showScanNext, setShowScanNext] = useState(false)
  const imageUploadRef = useRef<ImageUploadRef>(null)

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
    setQuickResult(null)
    setShowScanNext(false)

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

      if (quickMode) {
        // QUICK MODE: Fast OCR only, no price lookup
        const response = await fetch('/api/scan-quick', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (data.success) {
          setQuickResult(data.wine)
          toast.success('Label scanned!', { duration: 1500 })
        } else {
          toast.error(data.error || 'Failed to scan label')
        }
      } else {
        // FULL MODE: Complete extraction with price lookup
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
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Failed to scan wine label')
    } finally {
      setIsScanning(false)
    }
  }

  const handleQuickSave = async () => {
    if (!quickResult?.chateau) {
      toast.error('Wine name is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chateau: quickResult.chateau,
          wine_name: quickResult.wine_name,
          vintage: quickResult.vintage,
          region: quickResult.region,
          appellation: quickResult.appellation,
          country: quickResult.country,
          grape_variety: quickResult.grape_variety,
          color: quickResult.color,
          bottle_size: bottleSize,
          quantity,
          location_id: selectedLocation || null,
          image_data: capturedImageData,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        // Trigger background enrichment (fire and forget)
        if (data.wine?.id) {
          fetch(`/api/wines/${data.wine.id}/enrich`, {
            method: 'POST',
          }).catch(err => console.log('Background enrichment started:', err))
        }

        setScanCount(prev => prev + 1)
        toast.success(`Wine #${scanCount + 1} saved! Price lookup in progress...`)

        // Show scan next button
        setShowScanNext(true)
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

  const handleScanNext = () => {
    // Reset for next scan
    setQuickResult(null)
    setScanResult(null)
    setCapturedImageData(null)
    setManualPrice('')
    setQuantity(1)
    setShowScanNext(false)

    // Reset the image upload component
    if (imageUploadRef.current) {
      imageUploadRef.current.reset()
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
          <div className="flex items-center justify-between">
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
            {scanCount > 0 && (
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {scanCount} scanned
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Quick Mode Toggle */}
          <Card className={quickMode ? 'border-primary bg-primary/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className={`h-5 w-5 ${quickMode ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium">Quick Batch Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Fast scanning for wine cellars - price lookup happens in background
                    </p>
                  </div>
                </div>
                <Switch
                  checked={quickMode}
                  onCheckedChange={setQuickMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bottle size selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GlassWater className="h-5 w-5" />
                1. Bottle Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {BOTTLE_SIZES.slice(0, 6).map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setBottleSize(size.id)}
                    className={`p-2 rounded-lg border-2 text-center transition-colors ${
                      bottleSize === size.id
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <p className="font-medium text-xs">{size.name.split(' ')[0]}</p>
                    <p className="text-xs text-muted-foreground">{size.volume}</p>
                  </button>
                ))}
              </div>
              {/* Show more sizes in a dropdown for rare formats */}
              {BOTTLE_SIZES.length > 6 && (
                <Select value={bottleSize} onValueChange={setBottleSize}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue placeholder="More sizes..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BOTTLE_SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.name} ({size.volume})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Location - only show if we have locations */}
          {locations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" />
                  2. Storage Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-1">
                    <Input
                      placeholder="New..."
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                      className="w-24"
                    />
                    <Button
                      variant="outline"
                      size="icon"
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
              </CardContent>
            </Card>
          )}

          {/* Image upload - make it more prominent */}
          <Card className="border-2 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                {locations.length > 0 ? '3.' : '2.'} Scan Label
              </CardTitle>
              <CardDescription>
                {quickMode
                  ? 'Quick scan - just reads the label (1-2 seconds)'
                  : 'Full analysis with price lookup (may take longer)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                ref={imageUploadRef}
                onImageCapture={handleImageCapture}
                isLoading={isScanning}
              />
            </CardContent>
          </Card>

          {/* Quick scan results */}
          {quickMode && quickResult && (
            <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Confirm & Save
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Wine info - compact */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold truncate">{quickResult.chateau || 'Unknown'}</p>
                    {quickResult.wine_name && (
                      <p className="text-sm text-muted-foreground truncate">{quickResult.wine_name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {quickResult.vintage && (
                        <Badge variant="outline">{quickResult.vintage}</Badge>
                      )}
                      {getColorBadge(quickResult.color)}
                      {quickResult.region && (
                        <span className="text-sm text-muted-foreground">{quickResult.region}</span>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Quantity - prominent */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">How many bottles?</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="w-12 text-center text-2xl font-bold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Action buttons */}
                {showScanNext ? (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="lg"
                      onClick={handleScanNext}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Scan Next Bottle
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/')}
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleQuickSave}
                    disabled={isSaving || !quickResult.chateau}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Save & Continue
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Full scan results */}
          {!quickMode && scanResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Review Wine Details
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
