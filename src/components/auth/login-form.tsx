'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@radix-ui/react-label'
import { Wine, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const { signIn, signInWithOtp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [isLinkSent, setIsLinkSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } =
      mode === 'magic'
        ? await signInWithOtp(email)
        : await signIn(email, password)

    if (error) {
      setError(error.message)
      setIsLoading(false)
    } else {
      if (mode === 'magic') {
        setIsLinkSent(true)
        setIsLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    }
  }

  if (isLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="flex justify-center">
            <Wine className="h-12 w-12 text-wine-red" />
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a magic link to <strong>{email}</strong>.
            Open it to finish signing in.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setIsLinkSent(false)
              setMode('password')
            }}
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Wine className="h-12 w-12 text-wine-red" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">The Wine Ledger</h1>
          <p className="text-muted-foreground mt-2">Sign in to your collection</p>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === 'password' ? 'secondary' : 'outline'}
            onClick={() => setMode('password')}
          >
            Password
          </Button>
          <Button
            type="button"
            variant={mode === 'magic' ? 'secondary' : 'outline'}
            onClick={() => setMode('magic')}
          >
            Magic Link
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            {mode === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {mode === 'password' && (
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-wine-red hover:bg-wine-red/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'magic' ? 'Sending link...' : 'Signing in...'}
              </>
            ) : (
              mode === 'magic' ? 'Send Magic Link' : 'Sign In'
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
