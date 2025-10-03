import { useParams, Link } from 'react-router-dom'

export default function WineDetailView() {
  const { id } = useParams()
  return (
    <div className="p-4">
      <div className="mb-2 text-sm"><Link className="underline" to="/">← Back to collection</Link></div>
      <h2 className="text-xl font-semibold mb-2">Wine Detail</h2>
      <div className="text-gray-700">Wine ID: {id}</div>
      <div className="text-sm text-gray-600 mt-2">(Detail fetching can be implemented in a future work order.)</div>
    </div>
  )
}
