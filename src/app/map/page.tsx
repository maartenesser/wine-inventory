'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wine, MapPin, Globe, TrendingUp, Home } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import type { Wine as WineType } from '@/types/wine'
import { findWineRegion } from '@/lib/wine-regions'
import { readCache, writeCache } from '@/lib/local-cache'

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
  const cacheTtlMs = 5 * 60 * 1000

  useEffect(() => {
    const cachedWines = readCache<WineType[]>('wines-lite', cacheTtlMs)
    if (cachedWines?.length) {
      setWines(cachedWines)
      calculateStats(cachedWines)
      setIsLoading(false)
    }
    const cachedLocations = readCache<Location[]>('locations', cacheTtlMs)
    if (cachedLocations?.length) {
      setLocations(cachedLocations)
    }

    fetchWines()
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (data.locations) {
        setLocations(data.locations)
        writeCache('locations', data.locations)
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const fetchWines = async () => {
    try {
      const response = await fetch('/api/wines?lite=1')
      const data = await response.json()
      if (data.wines) {
        setWines(data.wines)
        calculateStats(data.wines)
        writeCache('wines-lite', data.wines)
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
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Location filter */}
        {locations.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Storage:</span>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Home className="h-4 w-4 mr-2 flex-shrink-0" />
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
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 mb-6">
          <Card>
            <CardContent className="px-4 py-4 md:px-6 md:py-6">
              <div className="flex items-center gap-2">
                <Wine className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold">{totalBottles}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Bottles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-4 md:px-6 md:py-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(totalValue)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-4 md:px-6 md:py-6">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold">{uniqueCountries}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-4 md:px-6 md:py-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold">{uniqueRegions}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Regions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card className="mb-6">
          <CardHeader className="px-4 py-4 md:px-6 md:py-6">
            <CardTitle className="text-base md:text-lg">
              {locationFilter === 'all'
                ? 'Your Wine Collection'
                : `Wines in ${currentLocationName}`}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {locationFilter === 'all'
                ? 'Click on a region to see your wines. Circle size = bottle count.'
                : `${filteredWines.length} wines in ${currentLocationName}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-4 md:px-6 md:pb-6">
            {isLoading ? (
              <Skeleton className="h-[350px] md:h-[500px] w-full" />
            ) : (
              <div className="h-[350px] md:h-[500px]">
                <WineMap wines={filteredWines} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Locations */}
        {locationStats.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="px-4 py-4 md:px-6 md:py-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Home className="h-4 w-4 md:h-5 md:w-5" />
                By Storage Location
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Tap to filter the map by cellar location
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                {locationStats.map((stat) => (
                  <button
                    key={stat.locationId}
                    onClick={() => setLocationFilter(
                      locationFilter === stat.locationId ? 'all' : stat.locationId
                    )}
                    className={`p-3 md:p-4 rounded-lg text-left transition-colors ${
                      locationFilter === stat.locationId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 hover:bg-muted active:bg-muted'
                    }`}
                  >
                    <p className="font-semibold text-sm md:text-lg truncate">{stat.location}</p>
                    <p className={`text-xs md:text-sm ${
                      locationFilter === stat.locationId
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    }`}>
                      {stat.bottleCount} bottles
                    </p>
                    <p className={`text-xs md:text-sm font-medium ${
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
        <div className="grid gap-4 md:gap-6 md:grid-cols-2">
          {/* Countries */}
          <Card>
            <CardHeader className="px-4 py-4 md:px-6 md:py-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Globe className="h-4 w-4 md:h-5 md:w-5" />
                By Country
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : countryStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-6 text-sm">
                  No wines with country information yet
                </p>
              ) : (
                <div className="space-y-2">
                  {countryStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <span className="text-lg md:text-2xl font-bold text-muted-foreground w-6 md:w-8 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{stat.country}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {stat.bottleCount} bottles
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm md:text-base flex-shrink-0 ml-2">{formatCurrency(stat.totalValue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Regions */}
          <Card>
            <CardHeader className="px-4 py-4 md:px-6 md:py-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                Top Regions
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : regionStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-6 text-sm">
                  No wines with region information yet
                </p>
              ) : (
                <div className="space-y-2">
                  {regionStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <span className="text-lg md:text-2xl font-bold text-muted-foreground w-6 md:w-8 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{stat.region}</p>
                          <p className="text-xs md:text-sm text-muted-foreground truncate">
                            {stat.country}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-sm md:text-base flex-shrink-0 ml-2">{formatCurrency(stat.totalValue)}</p>
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
