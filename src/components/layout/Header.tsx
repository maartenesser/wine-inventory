'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Wine, Camera, Globe, Download, Menu, Home, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserMenu } from '@/components/auth/user-menu'

interface HeaderProps {
  onRefresh?: () => void
  onExport?: () => void
  isLoading?: boolean
  title?: string
}

const navItems = [
  { href: '/', label: 'Collection', icon: Home },
  { href: '/scan', label: 'Scan Wine', icon: Camera },
  { href: '/map', label: 'Wine Map', icon: Globe },
]

export function Header({
  onRefresh,
  onExport,
  isLoading,
  title = 'Wine Inventory',
}: HeaderProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo and title */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Wine className="h-6 w-6 text-primary" />
              <span className="font-bold hidden sm:inline-block">{title}</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-secondary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Refresh</span>
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only sm:ml-2">Export</span>
                </Button>
              )}
            </div>
            <UserMenu />
          </div>

          {/* Mobile menu */}
          <div className="flex md:hidden items-center gap-2">
            <UserMenu compact />
            {/* Quick action button on mobile */}
            <Link href="/scan">
              <Button size="sm" className="gap-2">
                <Camera className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Scan</span>
              </Button>
            </Link>

            {/* Hamburger menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Wine className="h-5 w-5 text-primary" />
                    Wine Inventory
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                      >
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start gap-3"
                          size="lg"
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      </Link>
                    )
                  })}
                </nav>

                {/* Mobile actions */}
                {(onRefresh || onExport) && (
                  <div className="mt-6 pt-6 border-t space-y-2">
                    <p className="text-sm font-medium text-muted-foreground px-2 mb-3">
                      Actions
                    </p>
                    {onRefresh && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          onRefresh()
                          setIsOpen(false)
                        }}
                        disabled={isLoading}
                      >
                        <RefreshCw className={cn('h-5 w-5', isLoading && 'animate-spin')} />
                        Refresh Data
                      </Button>
                    )}
                    {onExport && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-3"
                        onClick={() => {
                          onExport()
                          setIsOpen(false)
                        }}
                      >
                        <Download className="h-5 w-5" />
                        Export to Excel
                      </Button>
                    )}
                  </div>
                )}

                {/* Account section */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium text-muted-foreground px-2 mb-3">
                    Account
                  </p>
                  <UserMenu />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
