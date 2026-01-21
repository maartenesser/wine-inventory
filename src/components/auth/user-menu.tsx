'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function UserMenu() {
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
        <Button
          size="sm"
          className="bg-wine-red hover:bg-wine-red/90"
          onClick={() => router.push('/signup')}
        >
          Sign Up
        </Button>
      </div>
    )
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{user.email}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Sign Out</span>
          </>
        )}
      </Button>
    </div>
  )
}
