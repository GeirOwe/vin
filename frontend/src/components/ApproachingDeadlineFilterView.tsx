import WineCollectionListView from './WineCollectionListView'

export default function ApproachingDeadlineFilterView() {
  return (
    <WineCollectionListView
      title="⏰ Wines Approaching Deadline"
      filterParams={{
        drinking_window_status: 'approaching_deadline'
      }}
      emptyStateMessage="No wines are approaching their drinking deadline. All your wines have plenty of time before they reach their peak or expire!"
    />
  )
}
