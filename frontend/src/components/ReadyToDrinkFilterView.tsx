import WineCollectionListView from './WineCollectionListView'

export default function ReadyToDrinkFilterView() {
  return (
    <WineCollectionListView
      title="🍷 Wines Ready to Drink"
      filterParams={{
        drinking_window_status: 'ready_to_drink'
      }}
      emptyStateMessage="No wines are currently ready to drink. Check back later or browse wines approaching their drinking window."
    />
  )
}
