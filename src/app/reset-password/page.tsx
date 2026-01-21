import { Suspense } from 'react'
import ResetPasswordClient from './reset-password-client'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={(
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Loading reset form...</span>
          </div>
        </div>
      )}
    >
      <ResetPasswordClient />
    </Suspense>
  )
}
