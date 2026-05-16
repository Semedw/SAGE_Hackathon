"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getApplications, Application, getNotifications, Notification, markNotificationRead } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Plus, FileText, Bell, CheckCheck } from "lucide-react"
import Link from "next/link"

export default function ApplicantDashboard() {
  const { user, isAuth, loading: authLoading } = useAuth()
  const router = useRouter()
  const [apps, setApps] = useState<Application[]>([])
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuth) { router.push("/login"); return }
    if (isAuth) {
      Promise.all([getApplications(), getNotifications()])
        .then(([appData, notifData]) => {
          setApps(appData.results || [])
          setNotifs((notifData as { results: Notification[] }).results || [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isAuth, authLoading, router])

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>

  const unreadCount = notifs.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">Manage your insurance applications</p>
        </div>
        <Link href="/applicant/upload">
          <Button><Plus className="mr-2 h-4 w-4" /> New Application</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Applications</CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{apps.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{apps.filter((a) => a.status === "UNDER_REVIEW" || a.status === "SUBMITTED").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-3xl font-bold">{unreadCount}</p>
            {unreadCount > 0 && <Bell className="h-5 w-5 text-amber-500" />}
          </CardContent>
        </Card>
      </div>

      {notifs.filter((n) => !n.is_read).length > 0 && (
        <Card className="mb-8 border-amber-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifs.filter((n) => !n.is_read).slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() =>
                  markNotificationRead(n.id).then(() =>
                    setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
                  )
                }>
                  <CheckCheck className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Your Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No applications yet</p>
              <Link href="/applicant/upload"><Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Submit Your First Application</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.map((app) => (
                <Link key={app.id} href={`/applicant/applications/${app.id}`}>
                  <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div>
                      <p className="font-medium">Application #{app.id}</p>
                      <p className="text-sm text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.evaluation && <span className="text-sm font-medium">{app.evaluation.total_score.toFixed(1)}%</span>}
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
