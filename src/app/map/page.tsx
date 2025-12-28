'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Wine, MapPin, Globe, TrendingUp, Home } from 'lucide-react'
import type { Wine as WineType } from '@/types/wine'
import { findWineRegion } from '@/lib/wine-regions'

interface Location {
  id: string
  name: string
}

// Dynamically import the map to avoid SSR issues with Leaflet
const WineMap = dynamic(
  () => import('@/components/map/WineMap').then(mod => mod.WineMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] bg-muted animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
)

interface CountryStats {
  country: string
  wineCount: number
  bottleCount: number
  totalValue: number
}

interface RegionStats {
  region: string
  country: string
  wineCount: number
  bottleCount: number
  totalValue: number
}

interface LocationStats {
  location: string
  locationId: string
  wineCount: number
  bottleCount: number
  totalValue: number
}

export default function MapPage() {
  const [wines, setWines] = useState<WineType[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [countryStats, setCountryStats] = useState<CountryStats[]>([])
  const [regionStats, setRegionStats] = useState<RegionStats[]>([])
  const [locationStats, setLocationStats] = useState<LocationStats[]>([])

  useEffect(() => {
    fetchWines()
    fetchLocations()
  }, [])

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

  const fetchWines = async () => {
    try {
      const response = await fetch('/api/wines')
      const data = await response.json()
      if (data.wines) {
        setWines(data.wines)
        calculateStats(data.wines)
      }
    } catch (error) {
      console.error('Failed to fetch wines:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (wineList: WineType[]) => {
    // Country stats
    const countryMap = new Map<string, CountryStats>()
    const regionMap = new Map<string, RegionStats>()
    const locMap = new Map<string, LocationStats>()

    wineList.forEach(wine => {
      const country = wine.country || 'Unknown'
      const regionInfo = findWineRegion(wine.region)
      const regionName = regionInfo?.name || wine.region || 'Unknown'
      const locationName = wine.locations?.name || 'Unknown'
      const locationId = wine.location_id || ''

      // Country stats
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          wineCount: 0,
          bottleCount: 0,
          totalValue: 0,
        })
      }
      const cStats = countryMap.get(country)!
      cStats.wineCount += 1
      cStats.bottleCount += wine.quantity
      cStats.totalValue += (wine.price_avg || 0) * wine.quantity

      // Region stats
      const regionKey = `${regionName}-${country}`
      if (!regionMap.has(regionKey)) {
        regionMap.set(regionKey, {
          region: regionName,
          country,
          wineCount: 0,
          bottleCount: 0,
          totalValue: 0,
        })
      }
      const rStats = regionMap.get(regionKey)!
      rStats.wineCount += 1
      rStats.bottleCount += wine.quantity
      rStats.totalValue += (wine.price_avg || 0) * wine.quantity

      // Storage location stats
      if (locationId) {
        if (!locMap.has(locationId)) {
          locMap.set(locationId, {
            location: locationName,
            locationId,
            wineCount: 0,
            bottleCount: 0,
            totalValue: 0,
          })
        }
        const lStats = locMap.get(locationId)!
        lStats.wineCount += 1
        lStats.bottleCount += wine.quantity
        lStats.totalValue += (wine.price_avg || 0) * wine.quantity
      }
    })

    // Sort by bottle count
    setCountryStats(
      Array.from(countryMap.values())
        .sort((a, b) => b.bottleCount - a.bottleCount)
    )
    setRegionStats(
      Array.from(regionMap.values())
        .filter(r => r.region !== 'Unknown')
        .sort((a, b) => b.bottleCount - a.bottleCount)
        .slice(0, 10)
    )
    setLocationStats(
      Array.from(locMap.values())
        .sort((a, b) => b.bottleCount - a.bottleCount)
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  // Filter wines by storage location
  const filteredWines = locationFilter === 'all'
    ? wines
    : wines.filter(w => w.location_id === locationFilter)

  const totalBottles = filteredWines.reduce((sum, w) => sum + w.quantity, 0)
  const totalValue = filteredWines.reduce((sum, w) => sum + (w.price_avg || 0) * w.quantity, 0)
  const uniqueCountries = new Set(filteredWines.map(w => w.country).filter(Boolean)).size
  const uniqueRegions = new Set(filteredWines.map(w => w.region).filter(Boolean)).size
  const currentLocationName = locationFilter === 'all'
    ? 'All Locations'
    : locations.find(l => l.id === locationFilter)?.name || 'Unknown'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Wine Map</h1>
              </div>
            </div>
            {locations.length > 0 && (
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-sm text-muted-foreground">Storage:</span>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Home className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Wine className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalBottles}</p>
                  <p className="text-sm text-muted-foreground">Total Bottles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{uniqueCountries}</p>
                  <p className="text-sm text-muted-foreground">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{uniqueRegions}</p>
                  <p className="text-sm text-muted-foreground">Regions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {locationFilter === 'all'
                ? 'Your Wine Collection Around the World'
                : `Wines in ${currentLocationName}`}
            </CardTitle>
            <CardDescription>
              {locationFilter === 'all'
                ? 'Click on a region to see your wines from that area. Circle size indicates bottle count.'
                : `Showing ${filteredWines.length} wines stored in ${currentLocationName}. Circle size indicates bottle count.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[600px] w-full" />
            ) : (
              <WineMap wines={filteredWines} />
            )}
          </CardContent>
        </Card>

        {/* Storage Locations */}
        {locationStats.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                By Storage Location (Cellar)
              </CardTitle>
              <CardDescription>
                Which wines are stored where. Click a location button to filter the map.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {locationStats.map((stat) => (
                  <button
                    key={stat.locationId}
                    onClick={() => setLocationFilter(
                      locationFilter === stat.locationId ? 'all' : stat.locationId
                    )}
                    className={`p-4 rounded-lg text-left transition-colors ${
                      locationFilter === stat.locationId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <p className="font-semibold text-lg">{stat.location}</p>
                    <p className={`text-sm ${
                      locationFilter === stat.locationId
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    }`}>
                      {stat.bottleCount} bottles
                    </p>
                    <p className={`text-sm font-medium ${
                      locationFilter === stat.locationId
                        ? 'text-primary-foreground'
                        : ''
                    }`}>
                      {formatCurrency(stat.totalValue)}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Countries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                By Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : countryStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No wines with country information yet
                </p>
              ) : (
                <div className="space-y-3">
                  {countryStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium">{stat.country}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.wineCount} wines · {stat.bottleCount} bottles
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(stat.totalValue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Regions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Top Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : regionStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No wines with region information yet
                </p>
              ) : (
                <div className="space-y-3">
                  {regionStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium">{stat.region}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.country} · {stat.bottleCount} bottles
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">{formatCurrency(stat.totalValue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
