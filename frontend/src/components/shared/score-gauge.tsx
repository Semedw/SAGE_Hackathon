import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { RiskBadge } from "./risk-badge"

interface ScoreGaugeProps {
  score: number
  riskLevel?: string
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
}

export function ScoreGauge({ score, riskLevel, showLabel = true, size = "md" }: ScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500"
    if (s >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn("font-semibold", size === "lg" ? "text-2xl" : "text-sm")}>
            {score.toFixed(1)}
          </span>
          {riskLevel && <RiskBadge level={riskLevel} />}
        </div>
      )}
      <Progress
        value={score}
        className={cn(
          size === "lg" && "h-3",
          size === "sm" && "h-1.5"
        )}
      />
      <div
        className={cn(
          "h-full rounded-full transition-all",
          getColor(score)
        )}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}
