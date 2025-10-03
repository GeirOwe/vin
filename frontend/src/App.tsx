import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  const isCollection = location.pathname === '/'

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">VIN</h1>
        <div className="flex gap-2">
          <Link to="/" className={`px-3 py-1.5 rounded border ${isCollection ? 'bg-black text-white' : 'border-gray-300'}`}>Collection</Link>
          <Link to="/add-wine" className={`px-3 py-1.5 rounded border ${!isCollection ? 'bg-black text-white' : 'border-gray-300'}`}>Add Wine</Link>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
