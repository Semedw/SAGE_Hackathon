import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, Zap, Search, BarChart3, CheckCircle, Users } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "AI-Powered Analysis",
    desc: "Automatically evaluates documents using OCR and intelligent scoring.",
  },
  {
    icon: Search,
    title: "Fraud Detection",
    desc: "Detects suspicious patterns, inconsistencies, and potential fraud indicators.",
  },
  {
    icon: BarChart3,
    title: "Smart Prioritization",
    desc: "Scores and ranks applications so reviewers focus on what matters most.",
  },
  {
    icon: CheckCircle,
    title: "Explainable Results",
    desc: "Clear summaries and highlighted issues for transparent decision-making.",
  },
  {
    icon: Users,
    title: "Human-AI Collaboration",
    desc: "AI handles screening, humans make final decisions with confidence.",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    desc: "Role-based access, audit logs, and secure document handling.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            AI-Powered Insurance Verification
          </div>
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Automate Insurance Document{" "}
            <span className="text-primary">Verification</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Reduce manual review time by 80%. Detect fraud early. Prioritize high-quality
            applications. Let AI handle the screening while your team focuses on decisions.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-12 px-8 text-base">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">How It Works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Upload Documents", desc: "Applicants upload identity docs, income proofs, and forms via the portal." },
              { step: "2", title: "AI Evaluation", desc: "Our engine runs OCR, checks consistency, quality, and detects risks automatically." },
              { step: "3", title: "Review & Decide", desc: "Reviewers get prioritized applications with clear AI summaries and actionable insights." },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">Features</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-xl border p-6">
                  <Icon className="mb-3 h-8 w-8 text-primary" />
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        InsureCheck AI — Built for the Insurance Verification Hackathon
      </footer>
    </div>
  )
}
