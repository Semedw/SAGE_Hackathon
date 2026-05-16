"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getApplication, ApplicationDetail, Document } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { RiskBadge } from "@/components/shared/risk-badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, XCircle, File, Eye } from "lucide-react"
import Link from "next/link"

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuth, loading: authLoading } = useAuth()
  const router = useRouter()
  const [app, setApp] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuth) { router.push("/login"); return }
    if (isAuth) getApplication(Number(id)).then(setApp).catch(console.error).finally(() => setLoading(false))
  }, [isAuth, authLoading, id, router])

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>
  if (!app) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Application not found</p></div>

  const ev = app.evaluation
  const criteria = ev ? [
    { label: "Document Completeness", score: ev.completeness_score, weight: "30%" },
    { label: "Data Consistency", score: ev.consistency_score, weight: "20%" },
    { label: "Document Quality", score: ev.quality_score, weight: "20%" },
    { label: "Identity Verification", score: ev.identity_score, weight: "15%" },
    { label: "Risk Assessment", score: ev.risk_score, weight: "15%" },
  ] : []

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link href="/applicant/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Application #{app.id}</h1>
          <p className="text-muted-foreground">Submitted {new Date(app.created_at).toLocaleDateString()}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {ev && (
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader><CardTitle className="text-lg">AI Evaluation Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold">{ev.total_score.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">out of 100</p>
                </div>
                <div className="flex-1 space-y-1">
                  <Progress value={ev.total_score} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Confidence: {(ev.confidence_score * 100).toFixed(0)}%</span>
                    <RiskBadge level={ev.risk_level} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{ev.summary}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">Score Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {criteria.map((c) => (
                <div key={c.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.label}</span><span className="font-medium">{(c.score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={c.score * 100} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {ev && ev.issues.length > 0 && (
        <Card className="mb-8 border-amber-200">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-amber-500" /> Detected Issues ({ev.issues.length})</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {ev.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {app.status === "CORRECTION_NEEDED" && (
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /><p className="text-sm font-medium">Correction requested by reviewer</p></div>
              <Link href="/applicant/upload"><Button variant="outline" size="sm">Resubmit</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5" /> Documents ({app.documents.length})</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {app.documents.map((doc: Document) => (
            <div key={doc.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.type.replace(/_/g, " ").toLowerCase()} • {(doc.file_size / 1024).toFixed(0)} KB
                    {doc.ocr_confidence !== null && ` • OCR: ${(doc.ocr_confidence * 100).toFixed(0)}%`}
                  </p>
                </div>
                {doc.is_blurry && <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3 w-3" /> Blurry</span>}
                {doc.ocr_confidence !== null && doc.ocr_confidence >= 0.8 && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Document Preview</span>
                </div>
                <div className="rounded border bg-white dark:bg-black overflow-hidden flex items-center justify-center min-h-[200px] max-h-[400px]">
                  {doc.mime_type?.startsWith("image/") ? (
                    <img
                      src={`http://localhost:8000${doc.file}`}
                      alt={doc.file_name}
                      className="max-w-full max-h-[400px] object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  ) : doc.mime_type === "application/pdf" ? (
                    <iframe
                      src={`http://localhost:8000${doc.file}`}
                      className="w-full h-[400px] border-0"
                      title={doc.file_name}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-muted-foreground">
                      <File className="h-6 w-6" />
                      <p className="text-xs">Preview not available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
