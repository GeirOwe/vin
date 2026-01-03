import WineCollectionListView from './WineCollectionListView'

export default function EmptyWinesView() {
  return (
    <WineCollectionListView
      title="📦 Empty Wines"
      filterParams={{
        quantity_filter: 'zero'
      }}
      emptyStateMessage="No empty wines found. All wines in your collection have quantity greater than zero."
    />
  )
}

