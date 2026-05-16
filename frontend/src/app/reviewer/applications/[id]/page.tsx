"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getReviewerApplicationDetail, takeReviewerAction, ReviewerApplicationDetail } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared/status-badge"
import { RiskBadge } from "@/components/shared/risk-badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, XCircle, AlertCircle, User, Mail, Calendar, File, Clock, Eye } from "lucide-react"
import Link from "next/link"

export default function ReviewerApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuth, isReviewer, loading: authLoading } = useAuth()
  const router = useRouter()
  const [app, setApp] = useState<ReviewerApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (!authLoading && (!isAuth || !isReviewer)) { router.push("/login"); return }
    if (isAuth && isReviewer) getReviewerApplicationDetail(Number(id)).then(setApp).catch(console.error).finally(() => setLoading(false))
  }, [isAuth, isReviewer, authLoading, id, router])

  async function handleAction(action: string) {
    setActionLoading(true)
    try {
      await takeReviewerAction(Number(id), action, comment)
      const updated = await getReviewerApplicationDetail(Number(id))
      setApp(updated)
      setComment("")
    } catch (err) { console.error(err) }
    finally { setActionLoading(false) }
  }

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>
  if (!app) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Application not found</p></div>

  const ev = app.evaluation
  const criteria = ev ? [
    { label: "Completeness", key: "completeness_score" as const, weight: 30 },
    { label: "Consistency", key: "consistency_score" as const, weight: 20 },
    { label: "Quality", key: "quality_score" as const, weight: 20 },
    { label: "Identity", key: "identity_score" as const, weight: 15 },
    { label: "Risk", key: "risk_score" as const, weight: 15 },
  ] : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Link href="/reviewer/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><User className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-2xl font-bold">{app.user.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {app.user.email}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(app.created_at).toLocaleDateString()}</span>
              <StatusBadge status={app.status} />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Application #{app.id}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">AI Evaluation Summary</CardTitle></CardHeader>
          <CardContent>
            {ev ? (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="text-center"><p className="text-5xl font-bold">{ev.total_score.toFixed(1)}</p><p className="text-xs text-muted-foreground">out of 100</p></div>
                  <div className="flex-1 space-y-2">
                    <Progress value={ev.total_score} />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confidence: {(ev.confidence_score * 100).toFixed(0)}%</span>
                      <RiskBadge level={ev.risk_level} />
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-4"><p className="text-sm">{ev.summary}</p></div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {criteria.map((c) => {
                    const score = ev[c.key] * 100
                    return (
                      <div key={c.key} className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                        <p className="text-lg font-bold">{score.toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground">Weight: {c.weight}%</p>
                      </div>
                    )
                  })}
                </div>
                {ev.issues.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium mb-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Highlighted Issues ({ev.issues.length})</h4>
                    <div className="space-y-1.5">
                      {ev.issues.slice(0, 10).map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{issue}</div>
                      ))}
                    </div>
                  </div>
                )}
                {ev.suggestions.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-medium mb-2"><AlertCircle className="h-4 w-4 text-blue-500" /> Suggested Review Areas</h4>
                    <div className="space-y-1.5">
                      {ev.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />{s}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : <p className="text-muted-foreground">No evaluation yet.</p>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Reviewer Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <textarea className="w-full min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm" placeholder="Add a comment (optional)..." value={comment} onChange={(e) => setComment(e.target.value)} />
              <div className="space-y-2">
                <Button className="w-full" variant="default" disabled={actionLoading} onClick={() => handleAction("APPROVED")}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</Button>
                <Button className="w-full" variant="destructive" disabled={actionLoading} onClick={() => handleAction("REJECTED")}><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
                <Button className="w-full" variant="outline" disabled={actionLoading} onClick={() => handleAction("CORRECTION_REQUESTED")}><AlertTriangle className="mr-2 h-4 w-4" /> Request Correction</Button>
                <Button className="w-full" variant="secondary" disabled={actionLoading} onClick={() => handleAction("ESCALATED")}><AlertCircle className="mr-2 h-4 w-4" /> Escalate</Button>
              </div>
            </CardContent>
          </Card>

          {app.reviewer_actions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Action History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {app.reviewer_actions.map((a) => (
                  <div key={a.id} className="rounded-lg border p-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{a.action}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                    {a.comment && <p className="mt-1 text-xs text-muted-foreground">&quot;{a.comment}&quot;</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground">by {a.reviewer_name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {app.audit_logs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> Audit Log</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {app.audit_logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium">{log.action.replace(/_/g, " ")}</span>
                    <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5" /> Uploaded Documents ({app.documents.length})</CardTitle></CardHeader>
        <CardContent>
          <Tabs defaultValue={app.documents[0]?.type || "all"}>
            <TabsList className="mb-4 flex-wrap">
              {app.documents.map((doc) => <TabsTrigger key={doc.id} value={doc.type}>{doc.type.replace(/_/g, " ")}</TabsTrigger>)}
            </TabsList>
            {app.documents.map((doc) => (
              <TabsContent key={doc.id} value={doc.type}>
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="flex items-center gap-2 text-sm font-medium">
                          <Eye className="h-4 w-4" /> Document Preview
                        </h4>
                        <span className="text-xs text-muted-foreground">{doc.file_name}</span>
                      </div>
                      <div className="rounded-lg border bg-white dark:bg-black overflow-hidden flex items-center justify-center min-h-[300px] max-h-[600px]">
                        {doc.mime_type?.startsWith("image/") ? (
                          <img
                            src={`http://localhost:8000${doc.file}`}
                            alt={doc.file_name}
                            className="max-w-full max-h-[600px] object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none"
                              ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
                            }}
                          />
                        ) : doc.mime_type === "application/pdf" ? (
                          <iframe
                            src={`http://localhost:8000${doc.file}`}
                            className="w-full h-[500px] border-0"
                            title={doc.file_name}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                            <File className="h-8 w-8" />
                            <p className="text-sm">Preview not available</p>
                          </div>
                        )}
                        <div className="hidden flex-col items-center gap-2 p-8 text-muted-foreground">
                          <File className="h-8 w-8" />
                          <p className="text-sm">Failed to load document</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Extracted Text (OCR)</h4>
                      <pre className="rounded-lg bg-muted p-4 text-xs leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">{doc.ocr_text || "No text extracted"}</pre>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                      <File className="h-10 w-10 text-muted-foreground" />
                      <div><p className="font-medium">{doc.file_name}</p><p className="text-xs text-muted-foreground">{(doc.file_size / 1024).toFixed(0)} KB • {doc.mime_type}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground">OCR Confidence</p>
                        <p className={`text-lg font-bold ${doc.ocr_confidence && doc.ocr_confidence >= 0.7 ? "text-green-600" : "text-amber-600"}`}>{doc.ocr_confidence ? `${(doc.ocr_confidence * 100).toFixed(0)}%` : "—"}</p>
                      </div>
                      <div className="rounded-lg border p-3 text-center">
                        <p className="text-xs text-muted-foreground">Quality Score</p>
                        <p className={`text-lg font-bold ${doc.quality_score && doc.quality_score >= 0.7 ? "text-green-600" : "text-amber-600"}`}>{doc.quality_score ? `${(doc.quality_score * 100).toFixed(0)}%` : "—"}</p>
                      </div>
                    </div>
                    {doc.is_blurry && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="text-sm text-amber-700">This document appears to be blurry</span></div>}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
