import { redirect } from 'next/navigation'
import { getSession } from '@/lib/supabase'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default async function ForgotPasswordPage() {
  const { session } = await getSession()

  // Redirect to home if already logged in
  if (session) {
    redirect('/')
  }

  return <ForgotPasswordForm />
}
