import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const TOKEN_KEY = 'vin_access_token'
const BRUKER_KEY = 'vin_bruker_id'

type AuthContextValue = {
  token: string | null
  brukerId: string | null
  isAuthenticated: boolean
  login: (token: string, brukerId: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [brukerId, setBrukerId] = useState<string | null>(() => localStorage.getItem(BRUKER_KEY))

  const login = useCallback((nextToken: string, nextBrukerId: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(BRUKER_KEY, nextBrukerId)
    setToken(nextToken)
    setBrukerId(nextBrukerId)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(BRUKER_KEY)
    setToken(null)
    setBrukerId(null)
  }, [])

  const value = useMemo(
    () => ({
      token,
      brukerId,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, brukerId, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
