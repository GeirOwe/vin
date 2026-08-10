import WineCollectionListView from './WineCollectionListView'

export default function EmptyWinesView() {
  return (
    <div className="section">
      <div className="section__head">
        <h1>Tomme flasker</h1>
        <p>Viner med antall null — drukket eller tomme.</p>
      </div>
      <WineCollectionListView
        showSearchAndSort={false}
        filterParams={{
          quantity_filter: 'zero',
        }}
        emptyStateMessage="Ingen tomme viner. Alle viner i samlingen har antall over null."
      />
    </div>
  )
}
