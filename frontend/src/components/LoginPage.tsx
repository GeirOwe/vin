import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { API_BASE, errorMessage } from '../hooks/useApi'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [brukerId, setBrukerId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bruker_id: brukerId, password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorMessage(data, res.status))
      login(data.access_token, data.bruker_id)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Innlogging feilet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section section--narrow" style={{ maxWidth: '28rem' }}>
      <div className="section__head">
        <h1>Logg inn</h1>
        <p>Bruk bruker-ID og passord for å åpne ditt Vin.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-1">
          <label htmlFor="bruker_id">Bruker-ID</label>
          <input
            id="bruker_id"
            className="field-control w-full"
            value={brukerId}
            onChange={(e) => setBrukerId(e.target.value)}
            placeholder="f.eks. geir"
            autoComplete="username"
            required
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="password">Passord</label>
          <input
            id="password"
            type="password"
            className="field-control w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Logger inn…' : 'Logg inn'}
        </button>
      </form>

      <p className="mt-6 text-sm" style={{ color: 'var(--ink-soft)' }}>
        Ny her? <Link to="/registrer">Opprett konto</Link>
      </p>
    </section>
  )
}
