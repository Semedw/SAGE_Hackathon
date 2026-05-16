"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createApplication, uploadDocument, evaluateApplication } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, File, X, CheckCircle2, Loader2 } from "lucide-react"

const DOCUMENT_TYPES = [
  { value: "ID_CARD", label: "ID Card / Passport" },
  { value: "INCOME_PROOF", label: "Income Proof" },
  { value: "ADDRESS_PROOF", label: "Address Proof" },
  { value: "MEDICAL_RECORD", label: "Medical Record" },
  { value: "INSURANCE_FORM", label: "Insurance Form" },
  { value: "SUPPORTING", label: "Supporting Document" },
]

export default function UploadPage() {
  const { isAuth, loading: authLoading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<"upload" | "uploading" | "processing" | "done">("upload")
  const [applicationId, setApplicationId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<{ file: File; type: string }[]>([])
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ total_score: number; risk_level: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuth) router.push("/login")
  }, [isAuth, authLoading, router])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase()
      return ext && ["pdf", "png", "jpg", "jpeg"].includes(ext)
    })
    if (droppedFiles.length === 0) { setError("Only PDF, PNG, and JPG files are accepted"); return }
    setFiles((prev) => [...prev, ...droppedFiles.map((f) => ({ file: f, type: "SUPPORTING" }))])
    setError("")
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase()
      return ext && ["pdf", "png", "jpg", "jpeg"].includes(ext)
    })
    setFiles((prev) => [...prev, ...selected.map((f) => ({ file: f, type: "SUPPORTING" }))])
    setError("")
  }

  const updateFileType = (index: number, type: string) =>
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, type } : f)))

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index))

  async function handleSubmit() {
    if (files.length === 0) { setError("Please add at least one document"); return }
    setStep("uploading"); setError("")
    try {
      const app = await createApplication()
      setApplicationId(app.id)
      for (const { file, type } of files) await uploadDocument(app.id, file, type)
      setStep("processing")
      const evalResult = await evaluateApplication(app.id)
      setResult({ total_score: evalResult.total_score, risk_level: evalResult.risk_level })
      setStep("done")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setStep("upload")
    }
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Loading...</p></div>

  if (step === "uploading") return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /><h2 className="mt-4 text-xl font-semibold">Uploading Documents...</h2><p className="text-muted-foreground">Please wait while your files are being uploaded.</p></div>
    </div>
  )

  if (step === "processing") return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center"><Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" /><h2 className="mt-4 text-xl font-semibold">AI is Evaluating Your Application</h2><p className="text-muted-foreground">Running OCR, checking documents, and calculating scores...</p></div>
    </div>
  )

  if (step === "done") return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <CardTitle className="text-xl">Application Submitted</CardTitle>
          <CardDescription>Your application has been evaluated by our AI system.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className="text-3xl font-bold">{result?.total_score.toFixed(1)}%</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {result?.risk_level === "LOW" ? "Your application looks good! A reviewer will process it shortly." :
             result?.risk_level === "HIGH" ? "Some issues were detected. A reviewer will contact you." :
             "A reviewer will review your application soon."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/applicant/dashboard")}>View Dashboard</Button>
            <Button variant="outline" onClick={() => router.push(`/applicant/applications/${applicationId}`)}>View Details</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New Insurance Application</h1>
        <p className="text-muted-foreground">Upload your insurance application documents</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>Drag and drop your files or click to browse. Accepted formats: PDF, PNG, JPG (max 10MB each).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag & drop files here, or{" "}
              <label className="cursor-pointer text-primary hover:underline">
                browse
                <input type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} />
              </label>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
          </div>
          {files.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{files.length} file(s) selected</p>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <File className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.file.name}</p>
                    <p className="text-xs text-muted-foreground">{(f.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <Select value={f.type} onValueChange={(v) => updateFileType(i, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(i)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" size="lg" disabled={files.length === 0} onClick={handleSubmit}>Submit Application</Button>
        </CardContent>
      </Card>
    </div>
  )
}
