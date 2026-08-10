import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, brukerId, logout } = useAuth()
  const isCollection = location.pathname === '/'
  const isDrinkingWindow = location.pathname === '/drikkevindu'
  const isAddWine = location.pathname === '/legg-til'
  const isEmpty = location.pathname === '/tomme'
  const isAuthPage = location.pathname === '/innlogging' || location.pathname === '/registrer'

  const handleLogout = () => {
    logout()
    navigate('/innlogging')
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" className="brand">
            Vin
          </Link>
          <nav className="site-nav" aria-label="Hovednavigasjon">
            {isAuthenticated ? (
              <>
                <Link to="/" className={isCollection ? 'is-active' : undefined}>
                  Samling
                </Link>
                <Link to="/drikkevindu" className={isDrinkingWindow ? 'is-active' : undefined}>
                  Drikkevindu
                </Link>
                <Link to="/tomme" className={isEmpty ? 'is-active' : undefined}>
                  Tomme
                </Link>
                <Link to="/legg-til" className={isAddWine ? 'is-active' : undefined}>
                  Legg til
                </Link>
                {brukerId && <span className="site-nav__user" title="Bruker-ID">{brukerId}</span>}
                <button type="button" className="btn btn--ghost btn--small" onClick={handleLogout}>
                  Logg ut
                </button>
              </>
            ) : (
              <>
                <Link to="/innlogging">Logg inn</Link>
                <Link to="/registrer">Opprett konto</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="site-main">
        {isCollection && isAuthenticated && (
          <section className="hero">
            <h1 className="hero__title">Vin</h1>
            <p className="hero__brand">
              by <span className="hero__brand-name">Owen Labs</span>
            </p>
            <p className="hero__lede">
              Hold orden på vinsamlingen — drikkevindu, beholdning og smaksnotater på ett sted.
            </p>
            <div className="hero__actions">
              <Link to="/legg-til" className="btn btn--primary">
                Legg til vin
              </Link>
              <Link to="/drikkevindu" className="btn btn--ghost">
                Drikkevindu
              </Link>
            </div>
          </section>
        )}

        {!isAuthenticated && isAuthPage && (
          <section className="hero" style={{ paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <h1 className="hero__title">Vin</h1>
            <p className="hero__brand">
              by <span className="hero__brand-name">Owen Labs</span>
            </p>
          </section>
        )}

        <Outlet />
      </main>

      <footer className="site-footer">
        <p>Vin · et Owen Labs-produkt</p>
      </footer>
    </div>
  )
}
