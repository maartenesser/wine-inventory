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
import { Trash2, Plus, Minus, Search, MapPin, Wine as WineIcon, Pencil } from 'lucide-react'
import type { Wine } from '@/types/wine'
import { getBottleSize } from '@/lib/bottle-sizes'

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

export function WineTable({ wines, locations = [], onUpdateQuantity, onDelete }: WineTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; wine: Wine | null }>({
    open: false,
    wine: null,
  })

  const filteredWines = wines.filter((wine) => {
    // Location filter
    if (locationFilter !== 'all') {
      if (!wine.location_id || wine.location_id !== locationFilter) {
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {locations.length > 0 && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <MapPin className="h-4 w-4 mr-2" />
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
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredWines.length} of {wines.length} wines
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead className="w-[220px]">Wine</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Vintage</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  {wines.length === 0
                    ? 'No wines in your collection yet. Scan a bottle to get started!'
                    : 'No wines match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredWines.map((wine) => (
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
          <DialogFooter>
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
