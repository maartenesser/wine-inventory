import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Settings are coming soon. You will be able to manage your email and password here.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Back to Collection</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
