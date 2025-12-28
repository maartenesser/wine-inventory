'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wine, Grape, Euro, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@/types/wine'

interface SummaryCardsProps {
  stats: DashboardStats
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Wines</CardTitle>
          <Wine className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalWines}</div>
          <p className="text-xs text-muted-foreground">
            unique wines in collection
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bottles</CardTitle>
          <Grape className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBottles}</div>
          <p className="text-xs text-muted-foreground">
            bottles in cellar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collection Value</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('nl-NL', {
              style: 'currency',
              currency: 'EUR',
            }).format(stats.totalValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            estimated total value
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Bottle Price</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('nl-NL', {
              style: 'currency',
              currency: 'EUR',
            }).format(stats.avgBottlePrice)}
          </div>
          <p className="text-xs text-muted-foreground">
            per bottle average
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
