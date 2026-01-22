'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Loader2, Wine, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { toast } from 'sonner'
import type { Wine as WineType } from '@/types/wine'
import { BOTTLE_SIZES } from '@/lib/bottle-sizes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Location {
  id: string
  name: string
}

export default function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [wine, setWine] = useState<WineType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])

  // Form state
  const [formData, setFormData] = useState({
    chateau: '',
    wine_name: '',
    vintage: '',
    region: '',
    appellation: '',
    country: '',
    grape_variety: '',
    color: '',
    alcohol_pct: '',
    bottle_size: 'standard',
    quantity: 1,
    price_avg: '',
    location_id: '',
    tasting_notes: '',
    food_pairing: '',
    winemaker_info: '',
    drinking_window: '',
  })

  const fetchWine = useCallback(async () => {
    try {
      const response = await fetch(`/api/wines/${id}`)
      const data = await response.json()

      if (data.wine) {
        setWine(data.wine)
        setFormData({
          chateau: data.wine.chateau || '',
          wine_name: data.wine.wine_name || '',
          vintage: data.wine.vintage?.toString() || '',
          region: data.wine.region || '',
          appellation: data.wine.appellation || '',
          country: data.wine.country || '',
          grape_variety: data.wine.grape_variety || '',
          color: data.wine.color || '',
          alcohol_pct: data.wine.alcohol_pct?.toString() || '',
          bottle_size: data.wine.bottle_size || 'standard',
          quantity: data.wine.quantity || 1,
          price_avg: data.wine.price_avg?.toString() || '',
          location_id: data.wine.location_id || '',
          tasting_notes: data.wine.tasting_notes || '',
          food_pairing: Array.isArray(data.wine.food_pairing)
            ? data.wine.food_pairing.join(', ')
            : data.wine.food_pairing || '',
          winemaker_info: data.wine.winemaker_info || '',
          drinking_window: data.wine.drinking_window || '',
        })
      } else {
        toast.error('Wine not found')
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching wine:', error)
      toast.error('Failed to load wine')
    } finally {
      setIsLoading(false)
    }
  }, [id, router])

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (data.locations) {
        setLocations(data.locations)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }, [])

  useEffect(() => {
    fetchWine()
    fetchLocations()
  }, [fetchWine, fetchLocations])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.chateau.trim()) {
      toast.error('Wine name is required')
      return
    }

    setIsSaving(true)
    try {
      // Parse food pairing from comma-separated string to array
      const foodPairingArray = formData.food_pairing
        ? formData.food_pairing.split(',').map(s => s.trim()).filter(Boolean)
        : null

      const response = await fetch(`/api/wines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chateau: formData.chateau,
          wine_name: formData.wine_name || null,
          vintage: formData.vintage ? parseInt(formData.vintage) : null,
          region: formData.region || null,
          appellation: formData.appellation || null,
          country: formData.country || null,
          grape_variety: formData.grape_variety || null,
          color: formData.color || null,
          alcohol_pct: formData.alcohol_pct ? parseFloat(formData.alcohol_pct) : null,
          bottle_size: formData.bottle_size || 'standard',
          quantity: formData.quantity,
          price_avg: formData.price_avg ? parseFloat(formData.price_avg) : null,
          location_id: formData.location_id || null,
          tasting_notes: formData.tasting_notes || null,
          food_pairing: foodPairingArray,
          winemaker_info: formData.winemaker_info || null,
          drinking_window: formData.drinking_window || null,
        }),
      })

      if (response.ok) {
        toast.success('Wine updated successfully')
        router.push('/')
      } else {
        toast.error('Failed to update wine')
      }
    } catch (error) {
      console.error('Error saving wine:', error)
      toast.error('Failed to save wine')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/wines/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Wine deleted')
        router.push('/')
      } else {
        toast.error('Failed to delete wine')
      }
    } catch (error) {
      console.error('Error deleting wine:', error)
      toast.error('Failed to delete wine')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!wine) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-6">
      <Header />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg md:text-xl font-bold">Edit Wine</h1>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Wine</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{wine.chateau}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:gap-6 md:grid-cols-3">
          {/* Wine image */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 md:pt-6">
              {wine.image_data ? (
                <Image
                  src={`data:image/jpeg;base64,${wine.image_data}`}
                  alt={wine.chateau}
                  className="w-full rounded-lg object-cover aspect-[3/4]"
                  width={450}
                  height={600}
                  unoptimized
                />
              ) : (
                <div className="w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                  <Wine className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit form */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                <CardTitle className="text-base md:text-lg">Basic Information</CardTitle>
                <CardDescription className="text-xs md:text-sm">Core details about the wine</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chateau">Chateau / Producer *</Label>
                    <Input
                      id="chateau"
                      value={formData.chateau}
                      onChange={(e) => handleChange('chateau', e.target.value)}
                      placeholder="e.g., Château Margaux"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wine_name">Wine Name</Label>
                    <Input
                      id="wine_name"
                      value={formData.wine_name}
                      onChange={(e) => handleChange('wine_name', e.target.value)}
                      placeholder="e.g., Grand Vin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vintage">Vintage</Label>
                    <Input
                      id="vintage"
                      type="number"
                      value={formData.vintage}
                      onChange={(e) => handleChange('vintage', e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select value={formData.color} onValueChange={(v) => handleChange('color', v)}>
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="alcohol_pct">Alcohol %</Label>
                    <Input
                      id="alcohol_pct"
                      type="number"
                      step="0.1"
                      value={formData.alcohol_pct}
                      onChange={(e) => handleChange('alcohol_pct', e.target.value)}
                      placeholder="13.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grape_variety">Grape Variety</Label>
                  <Input
                    id="grape_variety"
                    value={formData.grape_variety}
                    onChange={(e) => handleChange('grape_variety', e.target.value)}
                    placeholder="e.g., Cabernet Sauvignon, Merlot"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Origin */}
            <Card>
              <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                <CardTitle className="text-base md:text-lg">Origin</CardTitle>
                <CardDescription className="text-xs md:text-sm">Where the wine comes from</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      placeholder="e.g., France"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => handleChange('region', e.target.value)}
                      placeholder="e.g., Bordeaux"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appellation">Appellation</Label>
                  <Input
                    id="appellation"
                    value={formData.appellation}
                    onChange={(e) => handleChange('appellation', e.target.value)}
                    placeholder="e.g., Saint-Émilion Grand Cru"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                <CardTitle className="text-base md:text-lg">Inventory</CardTitle>
                <CardDescription className="text-xs md:text-sm">Stock and pricing</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bottle_size">Bottle Size</Label>
                    <Select value={formData.bottle_size} onValueChange={(v) => handleChange('bottle_size', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {BOTTLE_SIZES.map((size) => (
                          <SelectItem key={size.id} value={size.id}>
                            {size.name} ({size.volume})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_avg">Price (EUR)</Label>
                    <Input
                      id="price_avg"
                      type="number"
                      step="0.01"
                      value={formData.price_avg}
                      onChange={(e) => handleChange('price_avg', e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_id">Storage Location</Label>
                    <Select value={formData.location_id} onValueChange={(v) => handleChange('location_id', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasting & Pairing */}
            <Card>
              <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                <CardTitle className="text-base md:text-lg">Tasting & Pairing</CardTitle>
                <CardDescription className="text-xs md:text-sm">Wine characteristics and food suggestions</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tasting_notes">Tasting Notes</Label>
                  <Textarea
                    id="tasting_notes"
                    value={formData.tasting_notes}
                    onChange={(e) => handleChange('tasting_notes', e.target.value)}
                    placeholder="Describe the wine's taste profile, body, tannins, aromas..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="food_pairing">Food Pairing</Label>
                  <Input
                    id="food_pairing"
                    value={formData.food_pairing}
                    onChange={(e) => handleChange('food_pairing', e.target.value)}
                    placeholder="e.g., grilled lamb, aged cheese, beef stew (comma-separated)"
                  />
                  <p className="text-xs text-muted-foreground">Separate multiple items with commas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drinking_window">Best Drinking Window</Label>
                  <Input
                    id="drinking_window"
                    value={formData.drinking_window}
                    onChange={(e) => handleChange('drinking_window', e.target.value)}
                    placeholder="e.g., 2024-2030 or Drink now"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Producer Info */}
            <Card>
              <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                <CardTitle className="text-base md:text-lg">About the Producer</CardTitle>
                <CardDescription className="text-xs md:text-sm">Information about the winemaker or château</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                <div className="space-y-2">
                  <Label htmlFor="winemaker_info">Producer Information</Label>
                  <Textarea
                    id="winemaker_info"
                    value={formData.winemaker_info}
                    onChange={(e) => handleChange('winemaker_info', e.target.value)}
                    placeholder="History, reputation, winemaking style..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile fixed action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 flex gap-2 md:hidden">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="lg" className="flex-1" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Wine</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{wine.chateau}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="flex-1">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
      </div>
    </div>
  )
}
