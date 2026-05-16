"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Bell, LogOut, Shield, User } from "lucide-react"

export function Navbar() {
  const { user, isAuth, isReviewer, logout } = useAuth()

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-5 w-5 text-primary" />
          InsureCheck AI
        </Link>

        <div className="flex items-center gap-3">
          {isAuth ? (
            <>
              {isReviewer && (
                <Link href="/reviewer/dashboard">
                  <Button variant="ghost" size="sm">Reviewer Dashboard</Button>
                </Link>
              )}
              {!isReviewer && (
                <Link href="/applicant/dashboard">
                  <Button variant="ghost" size="sm">My Applications</Button>
                </Link>
              )}
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{user?.name}</span>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
