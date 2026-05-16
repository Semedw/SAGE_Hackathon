import { Badge } from "@/components/ui/badge"

interface RiskBadgeProps {
  level: string
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const config: Record<string, { label: string; variant: "low" | "medium" | "high" }> = {
    LOW: { label: "Low Risk", variant: "low" },
    MEDIUM: { label: "Medium Risk", variant: "medium" },
    HIGH: { label: "High Risk", variant: "high" },
  }

  const { label, variant } = config[level] || { label: level, variant: "medium" as const }

  return <Badge variant={variant}>{label}</Badge>
}
