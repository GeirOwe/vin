import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { DrinkingWindowStatus } from '../types/wine'
import WineCollectionListView from './WineCollectionListView'

type FilterTab = 'ready_to_drink' | 'approaching_deadline' | 'not_ready'

const filterTabs: { key: FilterTab; label: string; emoji: string; description: string }[] = [
  {
    key: 'ready_to_drink',
    label: 'Ready to Drink',
    emoji: '🍷',
    description: 'Wines currently in their optimal drinking window'
  },
  {
    key: 'approaching_deadline',
    label: 'Approaching Deadline',
    emoji: '⏰',
    description: 'Wines that should be consumed within 30 days'
  },
  {
    key: 'not_ready',
    label: 'Not Ready',
    emoji: '🌱',
    description: 'Wines that need more time to reach their peak'
  }
]

export default function DrinkingWindowMonitoringView() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ready_to_drink')

  const handleFilterChange = (filter: FilterTab) => {
    setActiveFilter(filter)
  }

  const getEmptyStateMessage = (filter: FilterTab): string => {
    switch (filter) {
      case 'ready_to_drink':
        return 'No wines are currently ready to drink. Check back later or browse wines approaching their drinking window.'
      case 'approaching_deadline':
        return 'No wines are approaching their drinking deadline. All your wines have plenty of time!'
      case 'not_ready':
        return 'All your wines are ready to drink! Consider adding some younger wines to your collection.'
      default:
        return 'No wines found matching the current filters.'
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Drinking Window Monitor</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Monitor your wine collection by drinking window status. Find wines ready to drink, 
          approaching their deadline, or still maturing.
        </p>
      </div>

      {/* Filter Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter by Drinking Window</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filterTabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeFilter === tab.key ? "default" : "outline"}
                onClick={() => handleFilterChange(tab.key)}
                className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                  activeFilter === tab.key 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{tab.emoji}</span>
                <span className="font-medium">{tab.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wine Collection Display */}
      <WineCollectionListView
        title={`${filterTabs.find(tab => tab.key === activeFilter)?.emoji} ${filterTabs.find(tab => tab.key === activeFilter)?.label}`}
        filterParams={{
          drinking_window_status: activeFilter as DrinkingWindowStatus
        }}
        emptyStateMessage={getEmptyStateMessage(activeFilter)}
      />
    </div>
  )
}
