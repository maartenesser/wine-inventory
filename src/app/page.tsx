'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Header } from '@/components/layout/Header'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { WineTable } from '@/components/dashboard/WineTable'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Wine as WineType, DashboardStats } from '@/types/wine'
import { useCachedValue, writeCache } from '@/lib/local-cache'

interface Location {
  id: string
  name: string
}

const CACHE_TTL_MS = 5 * 60 * 1000

function calculateStats(wineList: WineType[]): DashboardStats {
  const totalWines = wineList.length
  const totalBottles = wineList.reduce((sum, w) => sum + w.quantity, 0)
  const totalValue = wineList.reduce(
    (sum, w) => sum + (w.price_avg || 0) * w.quantity,
    0
  )
  const avgBottlePrice = totalBottles > 0 ? totalValue / totalBottles : 0

  // Group by region
  const regionMap = new Map<string, { count: number; value: number }>()
  wineList.forEach((w) => {
    const region = w.region || 'Unknown'
    const current = regionMap.get(region) || { count: 0, value: 0 }
    regionMap.set(region, {
      count: current.count + w.quantity,
      value: current.value + (w.price_avg || 0) * w.quantity,
    })
  })
  const winesByRegion = Array.from(regionMap.entries())
    .map(([region, data]) => ({ region, ...data }))
    .sort((a, b) => b.count - a.count)

  // Group by color
  const colorMap = new Map<string, number>()
  wineList.forEach((w) => {
    const color = w.color || 'Unknown'
    colorMap.set(color, (colorMap.get(color) || 0) + w.quantity)
  })
  const winesByColor = Array.from(colorMap.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)

  // Recent additions (last 5)
  const recentAdditions = [...wineList]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return {
    totalWines,
    totalBottles,
    totalValue,
    avgBottlePrice,
    winesByRegion,
    winesByColor,
    recentAdditions,
  }
}

export default function DashboardPage() {
  // Cached data (localStorage) renders instantly; fetched data replaces it once loaded.
  const cachedWines = useCachedValue<WineType[]>('wines-lite', CACHE_TTL_MS)
  const cachedLocations = useCachedValue<Location[]>('locations', CACHE_TTL_MS)
  const [fetchedWines, setWines] = useState<WineType[] | null>(null)
  const [fetchedLocations, setLocations] = useState<Location[] | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const wines = useMemo(
    () => fetchedWines ?? (cachedWines?.length ? cachedWines : []),
    [fetchedWines, cachedWines]
  )
  const locations = useMemo(
    () => fetchedLocations ?? (cachedLocations?.length ? cachedLocations : []),
    [fetchedLocations, cachedLocations]
  )
  const stats = useMemo(() => calculateStats(wines), [wines])
  const isLoading = isRefreshing || (isFetching && !cachedWines?.length)

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (data.locations) {
        setLocations(data.locations)
        writeCache('locations', data.locations)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }, [])

  const fetchWines = useCallback(async () => {
    try {
      const response = await fetch('/api/wines?lite=1')
      const data = await response.json()

      if (data.wines) {
        setWines(data.wines)
        writeCache('wines-lite', data.wines)
      }
    } catch (error) {
      console.error('Error fetching wines:', error)
      toast.error('Failed to load wines')
    } finally {
      setIsFetching(false)
      setIsRefreshing(false)
    }
  }, [])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    return fetchWines()
  }, [fetchWines])

  useEffect(() => {
    // Both fetchers only set state after their request resolves, never synchronously.
    const load = async () => {
      await Promise.all([fetchWines(), fetchLocations()])
    }
    load()
  }, [fetchWines, fetchLocations])

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    try {
      const response = await fetch(`/api/wines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        const updatedWines = wines.map((w) => (w.id === id ? { ...w, quantity } : w))
        setWines(updatedWines)
        writeCache('wines-lite', updatedWines)
        toast.success('Quantity updated')
      } else {
        toast.error('Failed to update quantity')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/wines/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const updatedWines = wines.filter((w) => w.id !== id)
        setWines(updatedWines)
        writeCache('wines-lite', updatedWines)
        toast.success('Wine deleted')
      } else {
        toast.error('Failed to delete wine')
      }
    } catch (error) {
      console.error('Error deleting wine:', error)
      toast.error('Failed to delete wine')
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `wine-inventory-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Export downloaded')
      } else {
        toast.error('Failed to export')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Failed to export')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Summary cards */}
        <SummaryCards stats={stats} />

        <Separator className="my-6" />

        {/* Wine table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Collection</h2>
          </div>
          <WineTable
            wines={wines}
            locations={locations}
            onUpdateQuantity={handleUpdateQuantity}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  )
}
