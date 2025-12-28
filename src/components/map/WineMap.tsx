'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { findWineRegion, COUNTRY_COORDINATES } from '@/lib/wine-regions'
import type { Wine } from '@/types/wine'
import 'leaflet/dist/leaflet.css'

interface WineMapProps {
  wines: Wine[]
}

interface RegionData {
  name: string
  country: string
  lat: number
  lng: number
  color: string
  description: string
  wines: Wine[]
  totalBottles: number
  totalValue: number
}

function MapController({ regions }: { regions: RegionData[] }) {
  const map = useMap()

  useEffect(() => {
    if (regions.length > 0) {
      const bounds = regions.map(r => [r.lat, r.lng] as [number, number])
      if (bounds.length === 1) {
        map.setView(bounds[0], 6)
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [regions, map])

  return null
}

export function WineMap({ wines }: WineMapProps) {
  const [regionData, setRegionData] = useState<RegionData[]>([])

  useEffect(() => {
    // Group wines by region
    const regionMap = new Map<string, RegionData>()

    wines.forEach(wine => {
      const region = findWineRegion(wine.region)
      const country = wine.country || 'Unknown'

      let key: string
      let data: Partial<RegionData>

      if (region) {
        key = `${region.name}-${region.country}`
        data = {
          name: region.name,
          country: region.country,
          lat: region.lat,
          lng: region.lng,
          color: region.color,
          description: region.description,
        }
      } else if (COUNTRY_COORDINATES[country]) {
        key = `country-${country}`
        data = {
          name: country,
          country: country,
          lat: COUNTRY_COORDINATES[country].lat,
          lng: COUNTRY_COORDINATES[country].lng,
          color: '#666666',
          description: `Wines from ${country}`,
        }
      } else {
        return // Skip wines without location info
      }

      if (!regionMap.has(key)) {
        regionMap.set(key, {
          ...data as RegionData,
          wines: [],
          totalBottles: 0,
          totalValue: 0,
        })
      }

      const existing = regionMap.get(key)!
      existing.wines.push(wine)
      existing.totalBottles += wine.quantity
      existing.totalValue += (wine.price_avg || 0) * wine.quantity
    })

    setRegionData(Array.from(regionMap.values()))
  }, [wines])

  if (typeof window === 'undefined') {
    return <div className="h-[600px] bg-muted animate-pulse rounded-lg" />
  }

  return (
    <div className="h-[600px] rounded-lg overflow-hidden border">
      <MapContainer
        center={[48.8566, 2.3522]}
        zoom={4}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController regions={regionData} />

        {regionData.map((region, idx) => {
          // Scale circle size based on bottle count (min 15, max 50)
          const radius = Math.min(50, Math.max(15, region.totalBottles * 5))

          return (
            <CircleMarker
              key={idx}
              center={[region.lat, region.lng]}
              radius={radius}
              fillColor={region.color}
              fillOpacity={0.7}
              color={region.color}
              weight={2}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-lg">{region.name}</h3>
                  <p className="text-sm text-gray-600">{region.country}</p>
                  <p className="text-sm mt-1">{region.description}</p>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Wines:</span>
                      <span className="font-semibold">{region.wines.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Bottles:</span>
                      <span className="font-semibold">{region.totalBottles}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Value:</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('nl-NL', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(region.totalValue)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t max-h-32 overflow-y-auto">
                    <p className="text-xs font-semibold mb-1">Wines in collection:</p>
                    {region.wines.slice(0, 5).map((wine, wIdx) => (
                      <p key={wIdx} className="text-xs text-gray-600">
                        • {wine.chateau} {wine.vintage && `(${wine.vintage})`}
                      </p>
                    ))}
                    {region.wines.length > 5 && (
                      <p className="text-xs text-gray-400 mt-1">
                        + {region.wines.length - 5} more...
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
