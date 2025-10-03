import { useState } from 'react'
import WineEntryForm from './components/WineEntryForm'
import WineList from './components/WineList'

export default function App() {
  const [view, setView] = useState<'form' | 'list'>('form')

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">VIN</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('form')} className={`px-3 py-1.5 rounded border ${view === 'form' ? 'bg-black text-white' : 'border-gray-300'}`}>New Wine</button>
          <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded border ${view === 'list' ? 'bg-black text-white' : 'border-gray-300'}`}>Wine List</button>
        </div>
      </div>

      {view === 'form' ? <WineEntryForm /> : <WineList />}
    </div>
  )
}
