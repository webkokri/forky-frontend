import { api } from '../../api'
import { useAsync } from '../../utils/useAsync'
import { useLocation2 } from '../../context/LocationContext'
import VendorCard from '../../components/VendorCard'
import { Empty, PageHead } from '../../components/AccountLayout'
import { Link } from 'react-router-dom'

export default function Favorites() {
  const { loc } = useLocation2()
  const { data, reload } = useAsync(() => api.listFavorites(), [loc?.lat, loc?.lng])
  return (
    <div>
      <PageHead title="Favourites" subtitle="Your go-to restaurants and stores." />
      <div className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-3">
        {(data || []).map((v) => (
          <div key={v.id}><VendorCard vendor={v} /><button onClick={async () => { await api.removeFavorite(v.id); reload() }} className="mt-2 text-xs font-bold text-rose-600">Remove from favourites</button></div>
        ))}
      </div>
      {data && !data.length && <Empty icon="❤️" title="No favourites yet" text="Tap the heart on a restaurant or store to save it here." action={<Link to="/restaurants" className="btn-primary">Browse restaurants</Link>} />}
    </div>
  )
}
