'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Minus, Search, MapPin, Wine as WineIcon, Pencil, ChevronRight, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import type { Wine } from '@/types/wine'
import { getBottleSize } from '@/lib/bottle-sizes'
import { getDrinkingStatus, getDrinkingStatusColor, type DrinkingStatus } from '@/lib/drinking-status'

interface Location {
  id: string
  name: string
}

interface WineTableProps {
  wines: Wine[]
  locations?: Location[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onDelete: (id: string) => void
}

type SortField = 'chateau' | 'vintage' | 'region' | 'color' | 'quantity' | 'price_avg' | 'total' | null
type SortDirection = 'asc' | 'desc'

export function WineTable({ wines, locations = [], onUpdateQuantity, onDelete }: WineTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [drinkingFilter, setDrinkingFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; wine: Wine | null }>({
    open: false,
    wine: null,
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortField(null)
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />
  }

  const filteredWines = wines.filter((wine) => {
    // Location filter
    if (locationFilter !== 'all') {
      if (!wine.location_id || wine.location_id !== locationFilter) {
        return false
      }
    }

    // Drinking status filter
    if (drinkingFilter !== 'all') {
      const status = getDrinkingStatus(wine.drinking_window)
      if (drinkingFilter === 'urgent') {
        // Show wines that need attention (drink soon, past peak)
        if (status.status !== 'drink-soon' && status.status !== 'past-peak') {
          return false
        }
      } else if (status.status !== drinkingFilter) {
        return false
      }
    }

    // Search filter
    const search = searchTerm.toLowerCase()
    return (
      wine.chateau.toLowerCase().includes(search) ||
      wine.region?.toLowerCase().includes(search) ||
      wine.vintage?.toString().includes(search) ||
      wine.grape_variety?.toLowerCase().includes(search) ||
      wine.locations?.name?.toLowerCase().includes(search)
    )
  })

  // Sort filtered wines
  const sortedWines = [...filteredWines].sort((a, b) => {
    if (!sortField) return 0

    let aVal: string | number | null = null
    let bVal: string | number | null = null

    switch (sortField) {
      case 'chateau':
        aVal = a.chateau.toLowerCase()
        bVal = b.chateau.toLowerCase()
        break
      case 'vintage':
        aVal = a.vintage
        bVal = b.vintage
        break
      case 'region':
        aVal = a.region?.toLowerCase() || ''
        bVal = b.region?.toLowerCase() || ''
        break
      case 'color':
        aVal = a.color || ''
        bVal = b.color || ''
        break
      case 'quantity':
        aVal = a.quantity
        bVal = b.quantity
        break
      case 'price_avg':
        aVal = a.price_avg
        bVal = b.price_avg
        break
      case 'total':
        aVal = (a.price_avg || 0) * a.quantity
        bVal = (b.price_avg || 0) * b.quantity
        break
    }

    // Handle nulls
    if (aVal === null && bVal === null) return 0
    if (aVal === null) return sortDirection === 'asc' ? 1 : -1
    if (bVal === null) return sortDirection === 'asc' ? -1 : 1

    // Compare
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Count wines by drinking status for filter badges
  const drinkingStatusCounts = wines.reduce((acc, wine) => {
    const status = getDrinkingStatus(wine.drinking_window)
    acc[status.status] = (acc[status.status] || 0) + wine.quantity
    return acc
  }, {} as Record<DrinkingStatus, number>)

  const urgentCount = (drinkingStatusCounts['drink-soon'] || 0) + (drinkingStatusCounts['past-peak'] || 0)

  const formatCurrency = (value: number | null) => {
    if (!value) return '-'
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  }

  const getColorBadge = (color: string | null) => {
    if (!color) return null
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      white: 'bg-yellow-200 text-black',
      rosé: 'bg-pink-300 text-black',
      sparkling: 'bg-amber-200 text-black',
      champagne: 'bg-amber-400 text-black',
      dessert: 'bg-orange-300 text-black',
    }
    return (
      <Badge className={colorMap[color] || 'bg-gray-500'}>
        {color}
      </Badge>
    )
  }

  const handleDelete = () => {
    if (deleteDialog.wine) {
      onDelete(deleteDialog.wine.id)
      setDeleteDialog({ open: false, wine: null })
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Drinking status filter */}
          <Select value={drinkingFilter} onValueChange={setDrinkingFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="Drinking status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All wines</SelectItem>
              <SelectItem value="urgent">
                <span className="flex items-center gap-2">
                  Needs attention
                  {urgentCount > 0 && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      {urgentCount}
                    </Badge>
                  )}
                </span>
              </SelectItem>
              <SelectItem value="drink-now">Drink now</SelectItem>
              <SelectItem value="drink-soon">Drink soon</SelectItem>
              <SelectItem value="too-young">Too young</SelectItem>
              <SelectItem value="past-peak">Past peak</SelectItem>
            </SelectContent>
          </Select>

          {locations.length > 0 && (
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
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
          )}
        </div>
      </div>

      {/* Urgent wines alert */}
      {urgentCount > 0 && drinkingFilter === 'all' && (
        <button
          onClick={() => setDrinkingFilter('urgent')}
          className="w-full p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-left hover:bg-orange-500/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            <span className="font-medium text-orange-700 dark:text-orange-400">
              {urgentCount} bottle{urgentCount !== 1 ? 's' : ''} need attention
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            These wines should be drunk soon or are past their peak
          </p>
        </button>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {sortedWines.length} of {wines.length} wines
      </p>

      {/* Mobile card view */}
      <div className="block lg:hidden space-y-3">
        {sortedWines.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {wines.length === 0
                ? 'No wines in your collection yet. Scan a bottle to get started!'
                : 'No wines match your search.'}
            </CardContent>
          </Card>
        ) : (
          sortedWines.map((wine) => (
            <Card
              key={wine.id}
              className="overflow-hidden active:bg-muted/50 transition-colors"
            >
              <CardContent className="p-0">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => router.push(`/wines/${wine.id}`)}
                >
                  {/* Wine image */}
                  {wine.image_data ? (
                    <img
                      src={`data:image/jpeg;base64,${wine.image_data}`}
                      alt={wine.chateau}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <WineIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Wine info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{wine.chateau}</h3>
                        {wine.wine_name && (
                          <p className="text-sm text-muted-foreground truncate">
                            {wine.wine_name}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {wine.vintage && (
                        <Badge variant="outline" className="text-xs">
                          {wine.vintage}
                        </Badge>
                      )}
                      {getColorBadge(wine.color)}
                      {wine.bottle_size && wine.bottle_size !== 'standard' && (
                        <Badge variant="secondary" className="text-xs">
                          {getBottleSize(wine.bottle_size)?.volume || wine.bottle_size}
                        </Badge>
                      )}
                      {wine.region && (
                        <span className="text-xs text-muted-foreground">
                          {wine.region}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {wine.locations && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {wine.locations.name}
                        </div>
                      )}
                      {/* Drinking status badge */}
                      {(() => {
                        const drinkStatus = getDrinkingStatus(wine.drinking_window)
                        if (drinkStatus.status === 'unknown') return null
                        return (
                          <Badge
                            className={`text-xs ${getDrinkingStatusColor(drinkStatus.status)}`}
                            title={drinkStatus.description}
                          >
                            {drinkStatus.label}
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateQuantity(wine.id, Math.max(0, wine.quantity - 1))
                        }}
                        disabled={wine.quantity <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{wine.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateQuantity(wine.id, wine.quantity + 1)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">bottles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatCurrency(wine.price_avg)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteDialog({ open: true, wine })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop table view */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead className="w-[220px]">
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => handleSort('chateau')}
                >
                  Wine
                  {getSortIcon('chateau')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => handleSort('region')}
                >
                  Region
                  {getSortIcon('region')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => handleSort('vintage')}
                >
                  Vintage
                  {getSortIcon('vintage')}
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center hover:text-foreground transition-colors"
                  onClick={() => handleSort('color')}
                >
                  Color
                  {getSortIcon('color')}
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-center">
                <button
                  className="flex items-center justify-center hover:text-foreground transition-colors w-full"
                  onClick={() => handleSort('quantity')}
                >
                  Qty
                  {getSortIcon('quantity')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  className="flex items-center justify-end hover:text-foreground transition-colors w-full"
                  onClick={() => handleSort('price_avg')}
                >
                  Price
                  {getSortIcon('price_avg')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  className="flex items-center justify-end hover:text-foreground transition-colors w-full"
                  onClick={() => handleSort('total')}
                >
                  Total
                  {getSortIcon('total')}
                </button>
              </TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  {wines.length === 0
                    ? 'No wines in your collection yet. Scan a bottle to get started!'
                    : 'No wines match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedWines.map((wine) => (
                <TableRow key={wine.id}>
                  <TableCell className="p-2">
                    {wine.image_data ? (
                      <img
                        src={`data:image/jpeg;base64,${wine.image_data}`}
                        alt={wine.chateau}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                        <WineIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{wine.chateau}</div>
                      {wine.wine_name && (
                        <div className="text-sm text-muted-foreground">{wine.wine_name}</div>
                      )}
                      {wine.grape_variety && (
                        <div className="text-xs text-muted-foreground">{wine.grape_variety}</div>
                      )}
                      {wine.locations && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {wine.locations.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{wine.region || '-'}</div>
                      {wine.country && (
                        <div className="text-xs text-muted-foreground">{wine.country}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{wine.vintage || '-'}</TableCell>
                  <TableCell>{getColorBadge(wine.color)}</TableCell>
                  <TableCell>
                    {(() => {
                      const drinkStatus = getDrinkingStatus(wine.drinking_window)
                      if (drinkStatus.status === 'unknown') {
                        return <span className="text-sm text-muted-foreground">-</span>
                      }
                      return (
                        <Badge
                          className={getDrinkingStatusColor(drinkStatus.status)}
                          title={drinkStatus.description}
                        >
                          {drinkStatus.label}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    {wine.bottle_size ? (
                      <span className="text-sm">
                        {getBottleSize(wine.bottle_size)?.volume || '750ml'}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">750ml</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(wine.id, Math.max(0, wine.quantity - 1))}
                        disabled={wine.quantity <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{wine.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onUpdateQuantity(wine.id, wine.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(wine.price_avg)}
                    {wine.price_source && (
                      <div className="text-xs text-muted-foreground">{wine.price_source}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(wine.price_avg ? wine.price_avg * wine.quantity : null)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/wines/${wine.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, wine })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, wine: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Wine</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteDialog.wine?.chateau}&quot;
              {deleteDialog.wine?.vintage && ` (${deleteDialog.wine.vintage})`} from your collection?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, wine: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
