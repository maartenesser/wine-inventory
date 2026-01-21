import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase/server'
import { SignUpForm } from '@/components/auth/signup-form'

export default async function SignUpPage() {
  const { session } = await getSession()

  // Redirect to home if already logged in
  if (session) {
    redirect('/')
  }

  return <SignUpForm />
}
