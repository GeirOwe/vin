import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { API_BASE, errorMessage } from '../hooks/useApi'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [brukerId, setBrukerId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bruker_id: brukerId,
          password,
          password_confirm: passwordConfirm,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(errorMessage(data, res.status))
      login(data.access_token, data.bruker_id)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Registrering feilet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section" style={{ maxWidth: '28rem' }}>
      <div className="section__head">
        <h1>Opprett konto</h1>
        <p>Velg en bruker-ID. Alle viner knyttes til denne ID-en.</p>
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
          <span className="text-sm" style={{ color: 'var(--muted-text)' }}>
            3–80 tegn. Bokstaver, tall, punktum, bindestrek og understrek.
          </span>
        </div>
        <div className="grid gap-1">
          <label htmlFor="password">Passord</label>
          <input
            id="password"
            type="password"
            className="field-control w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <span className="text-sm" style={{ color: 'var(--muted-text)' }}>Minst 8 tegn.</span>
        </div>
        <div className="grid gap-1">
          <label htmlFor="password_confirm">Bekreft passord</label>
          <input
            id="password_confirm"
            type="password"
            className="field-control w-full"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? 'Oppretter…' : 'Opprett konto'}
        </button>
      </form>

      <p className="mt-6 text-sm" style={{ color: 'var(--ink-soft)' }}>
        Har du allerede konto? <Link to="/innlogging">Logg inn</Link>
      </p>
    </section>
  )
}
