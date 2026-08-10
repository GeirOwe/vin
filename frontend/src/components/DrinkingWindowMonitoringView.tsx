import { useState } from 'react'
import { DrinkingWindowStatus } from '../types/wine'
import WineCollectionListView from './WineCollectionListView'

type FilterTab = 'ready_to_drink' | 'approaching_deadline' | 'not_ready'

const filterTabs: { key: FilterTab; label: string; description: string }[] = [
  {
    key: 'ready_to_drink',
    label: 'Klar til å drikke',
    description: 'Viner i optimalt drikkevindu nå',
  },
  {
    key: 'approaching_deadline',
    label: 'Nærmer seg frist',
    description: 'Viner som bør drikkes innen 30 dager',
  },
  {
    key: 'not_ready',
    label: 'Ikke klar',
    description: 'Viner som trenger mer tid før topp',
  },
]

export default function DrinkingWindowMonitoringView() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ready_to_drink')

  return (
    <div className="section">
      <div className="section__head">
        <h1>Drikkevindu</h1>
        <p>
          Følg samlingen etter drikkevindu — klar nå, nærmer seg, eller fortsatt modning.
        </p>
      </div>

      <div className="filter-tabs" role="tablist" aria-label="Filtre for drikkevindu">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeFilter === tab.key}
            className={`filter-tab ${activeFilter === tab.key ? 'is-active' : ''}`}
            onClick={() => setActiveFilter(tab.key)}
            title={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <WineCollectionListView
        showSearchAndSort={false}
        filterParams={{
          drinking_window_status: activeFilter as DrinkingWindowStatus,
        }}
        emptyStateMessage={
          activeFilter === 'ready_to_drink'
            ? 'Ingen viner er klare til å drikke nå.'
            : activeFilter === 'approaching_deadline'
              ? 'Ingen viner nærmer seg drikkefrist.'
              : 'Ingen viner er fortsatt under modning.'
        }
      />
    </div>
  )
}
