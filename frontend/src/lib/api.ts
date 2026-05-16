const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface ApiOptions extends RequestInit {
  skipAuth?: boolean
}

function getTokens() {
  if (typeof window === "undefined") return { access: null, refresh: null }
  return {
    access: localStorage.getItem("access_token"),
    refresh: localStorage.getItem("refresh_token"),
  }
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

export function clearTokens() {
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

export function isAuthenticated(): boolean {
  return !!getTokens().access
}

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getTokens()
  if (!refresh) return null

  try {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) {
      clearTokens()
      return null
    }
    const data = await res.json()
    localStorage.setItem("access_token", data.access)
    return data.access
  } catch {
    clearTokens()
    return null
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  if (!skipAuth) {
    const { access } = getTokens()
    if (access) {
      headers["Authorization"] = `Bearer ${access}`
    }
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (res.status === 401 && !skipAuth) {
    const newAccess = await refreshAccessToken()
    if (newAccess) {
      headers["Authorization"] = `Bearer ${newAccess}`
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
      })
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(error.detail || error.error || JSON.stringify(error))
  }

  return res.json()
}

export async function login(email: string, password: string) {
  const data = await api<{
    user: { id: number; email: string; name: string; role: string }
    access: string
    refresh: string
  }>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  })
  setTokens(data.access, data.refresh)
  return data.user
}

export async function register(data: {
  email: string
  username: string
  name: string
  password: string
}) {
  const res = await api<{
    user: { id: number; email: string; name: string; role: string }
    access: string
    refresh: string
  }>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(data),
    skipAuth: true,
  })
  setTokens(res.access, res.refresh)
  return res.user
}

export async function getMe() {
  return api<{ id: number; email: string; name: string; role: string; created_at: string }>(
    "/auth/me/"
  )
}

export async function getApplications(params?: string) {
  return api<{ results: Application[]; count: number }>(
    `/applications/${params || ""}`
  )
}

export async function createApplication() {
  return api<Application>("/applications/", { method: "POST", body: "{}" })
}

export async function getApplication(id: number) {
  return api<ApplicationDetail>(`/applications/${id}/`)
}

export async function uploadDocument(
  applicationId: number,
  file: File,
  docType: string
) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("type", docType)
  formData.append("file_name", file.name)
  formData.append("file_size", String(file.size))
  formData.append("mime_type", file.type)

  return api<Document>(`/applications/${applicationId}/documents/`, {
    method: "POST",
    body: formData,
  })
}

export async function evaluateApplication(applicationId: number) {
  return api<EvaluationResult>(
    `/applications/${applicationId}/evaluate/`,
    { method: "POST" }
  )
}

export async function getReviewerApplications(params?: string) {
  return api<{ results: Application[]; count: number }>(
    `/reviewer/applications/${params || ""}`
  )
}

export async function getReviewerApplicationDetail(id: number) {
  return api<ReviewerApplicationDetail>(`/reviewer/applications/${id}/`)
}

export async function takeReviewerAction(
  applicationId: number,
  action: string,
  comment?: string
) {
  return api<ReviewerAction>(
    `/reviewer/applications/${applicationId}/action/`,
    { method: "POST", body: JSON.stringify({ action, comment }) }
  )
}

export async function getNotifications() {
  return api<{ results: Notification[] }>("/notifications/")
}

export async function markNotificationRead(id: number) {
  return api<Notification>(`/notifications/${id}/read/`, { method: "PATCH" })
}

export async function getDashboardAnalytics() {
  return api<DashboardAnalytics>("/analytics/dashboard/")
}

export interface Application {
  id: number
  status: string
  created_at: string
  updated_at: string
  user?: { id: number; email: string; name: string; role: string }
  document_count?: number
  evaluation?: {
    total_score: number
    risk_level: string
    confidence_score: number
  } | null
}

export interface ApplicationDetail {
  id: number
  user: { id: number; email: string; name: string; role: string }
  status: string
  notes: string
  documents: Document[]
  evaluation?: EvaluationResult | null
  reviewer_actions: ReviewerAction[]
  audit_logs: AuditLog[]
  created_at: string
  updated_at: string
}

export interface Document {
  id: number
  application: number
  type: string
  file: string
  file_name: string
  file_size: number
  mime_type: string
  ocr_text: string | null
  ocr_confidence: number | null
  quality_score: number | null
  is_blurry: boolean
  uploaded_at: string
}

export interface EvaluationResult {
  id: number
  application: number
  completeness_score: number
  consistency_score: number
  quality_score: number
  identity_score: number
  risk_score: number
  total_score: number
  confidence_score: number
  risk_level: string
  summary: string
  issues: string[]
  suggestions: string[]
  created_at: string
}

export interface ReviewerApplicationDetail {
  id: number
  user: { id: number; email: string; name: string; role: string }
  status: string
  notes: string
  documents: Document[]
  evaluation: EvaluationResult | null
  reviewer_actions: ReviewerAction[]
  audit_logs: AuditLog[]
  created_at: string
  updated_at: string
}

export interface ReviewerAction {
  id: number
  application: number
  reviewer: number
  reviewer_name: string
  action: string
  comment: string
  created_at: string
}

export interface AuditLog {
  id: number
  application: number
  action: string
  details: Record<string, unknown> | null
  created_at: string
}

export interface Notification {
  id: number
  application: number
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export interface DashboardAnalytics {
  total_applications: number
  evaluated: number
  average_score: number
  high_risk_count: number
  pending_review: number
  approved: number
  rejected: number
  approval_rate: number
  status_distribution: { status: string; count: number }[]
  risk_distribution: { risk_level: string; count: number }[]
}
