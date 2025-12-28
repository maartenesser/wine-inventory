'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wine, Grape, Euro, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@/types/wine'

interface SummaryCardsProps {
  stats: DashboardStats
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium">Total Wines</CardTitle>
          <Wine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          <div className="text-xl md:text-2xl font-bold">{stats.totalWines}</div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            unique wines in collection
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium">Total Bottles</CardTitle>
          <Grape className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          <div className="text-xl md:text-2xl font-bold">{stats.totalBottles}</div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            bottles in cellar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium">Collection Value</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          <div className="text-lg md:text-2xl font-bold">
            {formatCurrency(stats.totalValue)}
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            estimated total value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4 md:px-6 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium">Avg. Price</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          <div className="text-lg md:text-2xl font-bold">
            {formatCurrency(stats.avgBottlePrice)}
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            per bottle average
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
