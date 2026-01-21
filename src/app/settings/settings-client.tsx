'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function SettingsClient() {
  const { user, updateEmail, updatePassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isEmailSaving, setIsEmailSaving] = useState(false)
  const [isPasswordSaving, setIsPasswordSaving] = useState(false)

  useEffect(() => {
    setEmail(user?.email ?? '')
  }, [user])

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailStatus(null)
    setEmailError(null)
    setIsEmailSaving(true)

    const { error } = await updateEmail(email)
    if (error) {
      setEmailError(error.message)
    } else {
      setEmailStatus('Check your email to confirm the change.')
    }
    setIsEmailSaving(false)
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordStatus(null)
    setPasswordError(null)

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setIsPasswordSaving(true)
    const { error } = await updatePassword(password)
    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordStatus('Password updated successfully.')
      setPassword('')
      setConfirmPassword('')
    }
    setIsPasswordSaving(false)
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {emailError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {emailError}
                </div>
              )}
              {emailStatus && (
                <div className="p-3 bg-emerald-500/10 text-emerald-600 text-sm rounded-lg">
                  {emailStatus}
                </div>
              )}
              <Button type="submit" disabled={isEmailSaving}>
                {isEmailSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Email'
                )}
              </Button>
            </form>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {passwordError}
                </div>
              )}
              {passwordStatus && (
                <div className="p-3 bg-emerald-500/10 text-emerald-600 text-sm rounded-lg">
                  {passwordStatus}
                </div>
              )}
              <Button type="submit" disabled={isPasswordSaving}>
                {isPasswordSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Button asChild variant="outline">
          <Link href="/">Back to Collection</Link>
        </Button>
      </div>
    </div>
  )
}
