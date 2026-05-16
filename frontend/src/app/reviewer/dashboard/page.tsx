"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getReviewerApplications, getDashboardAnalytics, Application, DashboardAnalytics } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/shared/status-badge"
import { RiskBadge } from "@/components/shared/risk-badge"
import { Search, TrendingUp, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

export default function ReviewerDashboard() {
  const { user, isAuth, isReviewer, loading: authLoading } = useAuth()
  const router = useRouter()
  const [apps, setApps] = useState<Application[]>([])
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortBy, setSortBy] = useState("-created_at")

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    if (riskFilter) params.set("risk", riskFilter)
    if (sortBy) params.set("ordering", sortBy)
    try {
      const [appData, analyticsData] = await Promise.all([
        getReviewerApplications(`?${params.toString()}`),
        getDashboardAnalytics(),
      ])
      setApps(appData.results || [])
      setAnalytics(analyticsData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [search, riskFilter, statusFilter, sortBy])

  useEffect(() => {
    if (!authLoading && (!isAuth || !isReviewer)) { router.push("/login"); return }
    if (isAuth && isReviewer) fetchData()
  }, [isAuth, isReviewer, authLoading, router, fetchData])

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>

  const cards = [
    { label: "Total Applications", value: analytics?.total_applications || 0, icon: TrendingUp, color: "text-blue-500" },
    { label: "Average Score", value: `${(analytics?.average_score || 0).toFixed(1)}%`, icon: TrendingUp, color: "text-green-500" },
    { label: "High Risk", value: analytics?.high_risk_count || 0, icon: AlertTriangle, color: "text-red-500" },
    { label: "Pending Review", value: analytics?.pending_review || 0, icon: Clock, color: "text-amber-500" },
    { label: "Approved", value: analytics?.approved || 0, icon: CheckCircle, color: "text-green-500" },
    { label: "Rejected", value: analytics?.rejected || 0, icon: XCircle, color: "text-red-500" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reviewer Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {user?.name}. Review and manage insurance applications.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className={`h-4 w-4 ${c.color}`} />{c.label}
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{c.value}</p></CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Search className="h-5 w-5" /> Applications</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name, email, or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Risk Level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CORRECTION_NEEDED">Correction Needed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-created_at">Newest First</SelectItem>
                <SelectItem value="created_at">Oldest First</SelectItem>
                <SelectItem value="-evaluation__total_score">Highest Score</SelectItem>
                <SelectItem value="evaluation__total_score">Lowest Score</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {apps.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No applications match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Applicant</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Risk</th>
                    <th className="pb-3 font-medium">Docs</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3"><p className="font-medium">{app.user?.name || "N/A"}</p><p className="text-xs text-muted-foreground">{app.user?.email}</p></td>
                      <td className="py-3"><StatusBadge status={app.status} /></td>
                      <td className="py-3">{app.evaluation ? <span className={`font-semibold ${app.evaluation.total_score >= 80 ? "text-green-600" : app.evaluation.total_score >= 50 ? "text-amber-600" : "text-red-600"}`}>{app.evaluation.total_score.toFixed(1)}%</span> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-3">{app.evaluation?.risk_level ? <RiskBadge level={app.evaluation.risk_level} /> : <span className="text-muted-foreground">—</span>}</td>
                      <td className="py-3">{app.document_count || 0}</td>
                      <td className="py-3 text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="py-3"><Link href={`/reviewer/applications/${app.id}`}><Button variant="outline" size="sm">Review</Button></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
