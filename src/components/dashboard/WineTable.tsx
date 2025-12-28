'use client'

import { useState } from 'react'
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
import { Trash2, Plus, Minus, Search } from 'lucide-react'
import type { Wine } from '@/types/wine'

interface WineTableProps {
  wines: Wine[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onDelete: (id: string) => void
}

export function WineTable({ wines, onUpdateQuantity, onDelete }: WineTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; wine: Wine | null }>({
    open: false,
    wine: null,
  })

  const filteredWines = wines.filter((wine) => {
    const search = searchTerm.toLowerCase()
    return (
      wine.chateau.toLowerCase().includes(search) ||
      wine.region?.toLowerCase().includes(search) ||
      wine.vintage?.toString().includes(search) ||
      wine.grape_variety?.toLowerCase().includes(search)
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
      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search wines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredWines.length} of {wines.length} wines
        </span>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Wine</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Vintage</TableHead>
              <TableHead>Color</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {wines.length === 0
                    ? 'No wines in your collection yet. Scan a bottle to get started!'
                    : 'No wines match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredWines.map((wine) => (
                <TableRow key={wine.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{wine.chateau}</div>
                      {wine.wine_name && (
                        <div className="text-sm text-muted-foreground">{wine.wine_name}</div>
                      )}
                      {wine.grape_variety && (
                        <div className="text-xs text-muted-foreground">{wine.grape_variety}</div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialog({ open: true, wine })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
