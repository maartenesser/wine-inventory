import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const { session } = await getSession()

  // Redirect to home if already logged in
  if (session) {
    redirect('/')
  }

  return <LoginForm />
}
