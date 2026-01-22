'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload, type ImageUploadRef } from '@/components/camera/ImageUpload'
import { Check, Loader2, Plus, Minus, MapPin, GlassWater, Camera, Package, Wine, Pencil, Sparkles, DollarSign, Grape, Globe } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { toast } from 'sonner'
import { BOTTLE_SIZES } from '@/lib/bottle-sizes'

interface Location {
  id: string
  name: string
  description: string | null
}

interface ScanResult {
  chateau: string | null
  wine_name: string | null
  vintage: number | null
  color: 'red' | 'white' | 'rosé' | 'sparkling' | 'champagne' | 'dessert' | null
  // These are optional - usually not on label, will be enriched later
  region?: string | null
  country?: string | null
  grape_variety?: string | null
  appellation?: string | null
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
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  // Editable wine fields (only essential info from label)
  const [chateau, setChateau] = useState('')
  const [wineName, setWineName] = useState('')
  const [vintage, setVintage] = useState<string>('')
  const [color, setColor] = useState<string>('')

  const [quantity, setQuantity] = useState(1)
  const [bottleSize, setBottleSize] = useState<string>('standard')
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [newLocationName, setNewLocationName] = useState('')
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [showScanNext, setShowScanNext] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentComplete, setEnrichmentComplete] = useState(false)
  const imageUploadRef = useRef<ImageUploadRef>(null)
  const [nearestLocationName, setNearestLocationName] = useState<string>('')

  // Fetch locations and detect nearest one on mount
  useEffect(() => {
    fetchLocations()
    detectNearestLocation()
  }, [])

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

  // Update editable fields when scan result changes
  useEffect(() => {
    if (scanResult) {
      setChateau(scanResult.chateau || '')
      setWineName(scanResult.wine_name || '')
      setVintage(scanResult.vintage?.toString() || '')
      setColor(scanResult.color || '')
    }
  }, [scanResult])

  const detectNearestLocation = () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude
        const userLng = position.coords.longitude

        let nearestLocation = ''
        let minDistance = Infinity

        for (const [name, coords] of Object.entries(LOCATION_COORDINATES)) {
          const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng)
          if (distance < minDistance) {
            minDistance = distance
            nearestLocation = name
          }
        }

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
    setShowScanNext(false)

    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        const base64Data = base64.split(',')[1]
        setCapturedImageData(base64Data)
      }
      reader.readAsDataURL(file)

      const formData = new FormData()
      formData.append('image', file)

      // Quick scan - fast OCR only
      const response = await fetch('/api/scan-quick', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setScanResult(data.wine)
        toast.success('Label scanned!', { duration: 1500 })
      } else {
        toast.error(data.error || 'Failed to scan label')
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast.error('Failed to scan wine label')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSave = async () => {
    if (!chateau.trim()) {
      toast.error('Wine name is required')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/wines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chateau: chateau.trim(),
          wine_name: wineName.trim() || null,
          vintage: vintage ? parseInt(vintage) : null,
          color: color || null,
          bottle_size: bottleSize,
          quantity,
          location_id: selectedLocation || null,
          image_data: capturedImageData,
          // Region, grape, etc. will be filled in by background enrichment
        }),
      })

      if (response.ok) {
        const data = await response.json()

        setScanCount(prev => prev + 1)
        setShowScanNext(true)
        // Trigger background enrichment for price lookup
        if (data.wine?.id) {
          setIsEnriching(true)
          setEnrichmentComplete(false)

          fetch(`/api/wines/${data.wine.id}/enrich`, {
            method: 'POST',
          })
            .then(res => res.json())
            .then(enrichData => {
              setIsEnriching(false)
              setEnrichmentComplete(true)
              if (enrichData.enrichedFields?.length > 0) {
                toast.success(`Found: ${enrichData.enrichedFields.join(', ')}`, { duration: 3000 })
              }
            })
            .catch(err => {
              console.log('Background enrichment error:', err)
              setIsEnriching(false)
            })
        }

        toast.success(`${quantity} bottle${quantity > 1 ? 's' : ''} saved!`)
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
    setScanResult(null)
    setCapturedImageData(null)
    setChateau('')
    setWineName('')
    setVintage('')
    setColor('')
    setQuantity(1)
    setShowScanNext(false)
    setIsEnriching(false)
    setEnrichmentComplete(false)

    if (imageUploadRef.current) {
      imageUploadRef.current.reset()
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        {/* Scan count badge */}
        {scanCount > 0 && (
          <div className="mb-4 flex justify-center">
            <Badge variant="secondary" className="text-base px-4 py-1.5">
              {scanCount} bottle{scanCount !== 1 ? 's' : ''} scanned this session
            </Badge>
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1: Bottle Size */}
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

          {/* Step 2: Location */}
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

          {/* Step 3: Scan Label */}
          <Card className="border-2 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5" />
                {locations.length > 0 ? '3.' : '2.'} Scan Label
              </CardTitle>
              <CardDescription>
                Take a photo of the wine label for quick OCR
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

          {/* Scan Results - Editable Form */}
          {scanResult && (
            <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Wine className="h-5 w-5 text-green-500" />
                  Review & Edit
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  Correct any OCR mistakes below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image preview and wine info side by side */}
                <div className="flex gap-4">
                  {/* Image thumbnail */}
                  {capturedImageData && (
                    <div className="flex-shrink-0">
                      <Image
                        src={`data:image/jpeg;base64,${capturedImageData}`}
                        alt="Wine bottle"
                        className="w-24 h-32 object-cover rounded-lg border shadow-sm"
                        width={96}
                        height={128}
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Main wine info - only essential fields visible on label */}
                  <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Chateau / Producer *</label>
                    <Input
                      value={chateau}
                      onChange={(e) => setChateau(e.target.value)}
                      placeholder="e.g., Château Margaux"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Wine Name (optional)</label>
                    <Input
                      value={wineName}
                      onChange={(e) => setWineName(e.target.value)}
                      placeholder="e.g., Grand Vin"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Vintage</label>
                      <Input
                        type="number"
                        value={vintage}
                        onChange={(e) => setVintage(e.target.value)}
                        placeholder="e.g., 2018"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <Select value={color} onValueChange={setColor}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="white">White</SelectItem>
                          <SelectItem value="rosé">Rosé</SelectItem>
                          <SelectItem value="sparkling">Sparkling</SelectItem>
                          <SelectItem value="champagne">Champagne</SelectItem>
                          <SelectItem value="dessert">Dessert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  </div>
                </div>

                {/* Info about background enrichment */}
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  Region, grape variety, price and other details will be looked up automatically after saving.
                </p>

                <Separator />

                {/* Quantity Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">How many bottles?</label>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-2xl font-bold">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-muted-foreground">bottle{quantity !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Case quick buttons */}
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Case:</span>
                    <div className="flex gap-2 flex-1">
                      {[1, 3, 6, 12].map((num) => (
                        <Button
                          key={num}
                          variant={quantity === num ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() => setQuantity(num)}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {quantity > 1 && (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                      Price per bottle will be looked up automatically, then multiplied by {quantity} for total case value.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Enrichment Status */}
                {showScanNext && (isEnriching || enrichmentComplete) && (
                  <div className={`rounded-lg p-4 ${enrichmentComplete ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {isEnriching ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="font-medium text-blue-700 dark:text-blue-400">Looking up wine details...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-green-700 dark:text-green-400">Enrichment complete!</span>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className={`flex items-center gap-2 ${isEnriching ? 'animate-pulse' : ''}`}>
                        <Globe className={`h-4 w-4 ${enrichmentComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-muted-foreground">Region & Country</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isEnriching ? 'animate-pulse' : ''}`}>
                        <Grape className={`h-4 w-4 ${enrichmentComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-muted-foreground">Grape Variety</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isEnriching ? 'animate-pulse' : ''}`}>
                        <DollarSign className={`h-4 w-4 ${enrichmentComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-muted-foreground">Price Lookup</span>
                      </div>
                      <div className={`flex items-center gap-2 ${isEnriching ? 'animate-pulse' : ''}`}>
                        <Wine className={`h-4 w-4 ${enrichmentComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
                        <span className="text-muted-foreground">Tasting Notes</span>
                      </div>
                    </div>
                  </div>
                )}

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
                    onClick={handleSave}
                    disabled={isSaving || !chateau.trim()}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Save {quantity > 1 ? `${quantity} Bottles` : 'Bottle'}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
