"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { getMe, login as apiLogin, register as apiRegister, clearTokens, isAuthenticated } from "./api"

interface User {
  id: number
  email: string
  name: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: { email: string; username: string; name: string; password: string }) => Promise<User>
  logout: () => void
  isAuth: boolean
  isReviewer: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated()) {
      getMe()
        .then(setUser)
        .catch(() => clearTokens())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const userData = await apiLogin(email, password)
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (data: { email: string; username: string; name: string; password: string }) => {
    const userData = await apiRegister(data)
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuth: !!user,
        isReviewer: user?.role === "REVIEWER" || user?.role === "ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
