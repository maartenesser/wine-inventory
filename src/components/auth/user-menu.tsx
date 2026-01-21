'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2, Settings, User } from 'lucide-react'

export function UserMenu() {
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current || !(event.target instanceof Node)) return
      if (!menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/login')}
        >
          Sign In
        </Button>
      </div>
    )
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <div ref={menuRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="sr-only">Open user menu</span>
        <div className="h-9 w-9 rounded-full bg-wine-red text-white flex items-center justify-center text-sm font-semibold">
          {(user.email ?? 'U').charAt(0).toUpperCase()}
        </div>
      </Button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-md border bg-background shadow-lg"
        >
          <div className="px-3 py-2 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
          <div className="py-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2 px-3"
              onClick={() => {
                setIsOpen(false)
                router.push('/settings')
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start gap-2 px-3 text-destructive hover:text-destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
