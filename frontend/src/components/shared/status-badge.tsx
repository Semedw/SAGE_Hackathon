import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" | "low" | "medium" | "high" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    SUBMITTED: { label: "Submitted", variant: "default" },
    UNDER_REVIEW: { label: "Under Review", variant: "warning" },
    APPROVED: { label: "Approved", variant: "success" },
    REJECTED: { label: "Rejected", variant: "destructive" },
    CORRECTION_NEEDED: { label: "Correction Needed", variant: "warning" },
  }

  const { label, variant } = config[status] || { label: status, variant: "outline" as const }

  return <Badge variant={variant}>{label}</Badge>
}
