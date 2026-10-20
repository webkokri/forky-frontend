import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAsync } from '../utils/useAsync'
import { useInfinite } from '../utils/useInfinite'
import InfiniteSentinel from '../components/InfiniteSentinel'
import VendorCard from '../components/VendorCard'
import { useLocation2 } from '../context/LocationContext'
import { ModeToggle, useMode } from '../context/ModeContext'
import { SectionTitle, Skeleton } from '../components/ui'

const SORTS = { relevance: 'Relevance', rating: 'Rating', eta: 'Delivery time', costLow: 'Delivery fee: low to high', price: 'Price level: low to high' }

const SERVER_SORT = { rating: 'rating', eta: 'eta', costLow: 'fee' }

export default function Restaurants() {
  const { label, loc } = useLocation2()
  const { mode, pickup } = useMode()
  const [params, setParams] = useSearchParams()
  const cuisine = params.get('cuisine') || ''
  const { data: cats } = useAsync(() => api.listFoodCategories(), [])
  const [f, setF] = useState({ open: false, top: false, fast: false, offers: false, sort: 'relevance' })
  const toggle = (k) => setF((s) => ({ ...s, [k]: !s[k] }))

  // Pages load as you scroll; open-now and sorting are done by the API, the rest filters what is loaded.
  const inf = useInfinite((page) => api.listVendorsPage({ vertical: 'FOOD', cuisine, openNow: f.open, sort: SERVER_SORT[f.sort], fulfilment: mode }, page), [cuisine, f.open, f.sort, mode, loc?.lat, loc?.lng])

  const shown = useMemo(() => {
    let r = inf.items
    if (f.top) r = r.filter((x) => x.rating >= 4.5)
    if (f.fast) r = r.filter((x) => x.etaMins <= 25)
    if (f.offers) r = r.filter((x) => x.offer)
    return f.sort === 'price' ? [...r].sort((a, b) => a.priceLevel - b.priceLevel) : r
  }, [inf.items, f])

  return (
    <div className="container-x py-8">
      <SectionTitle title={cuisine ? `${cats?.find((c) => c.id === cuisine)?.name || cuisine} near you` : 'Restaurants near you'} subtitle={`${inf.loading ? 'Finding' : shown.length} places ${pickup ? 'for pickup near' : 'delivering to'} ${label || 'your area'}`} />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <button onClick={() => setParams({})} className={`chip ${!cuisine ? 'chip-active' : ''}`}>All</button>
        {(cats || []).map((c) => (
          <button key={c.id} onClick={() => setParams({ cuisine: c.id })} className={`chip ${cuisine === c.id ? 'chip-active' : ''}`}>{c.emoji} {c.name}</button>
        ))}
      </div>
      <div className="sticky top-[6.25rem] z-20 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b border-ink-100 bg-white px-4 py-3 lg:top-16">
        <ModeToggle />
        <select value={f.sort} onChange={(e) => setF((s) => ({ ...s, sort: e.target.value }))} className="chip cursor-pointer outline-none">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>Sort: {v}</option>)}
        </select>
        {[['fast', 'Fast delivery'], ['top', 'Ratings 4.5+'], ['open', 'Open now'], ['offers', 'Offers']].map(([k, label]) => (
          <button key={k} onClick={() => toggle(k)} className={`chip ${f[k] ? 'chip-active' : ''}`}>{label}{f[k] && ' ✕'}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {inf.loading ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />) : shown.map((r) => <VendorCard key={r.id} vendor={r} />)}
      </div>
      <InfiniteSentinel inf={inf} />
      {!inf.loading && !inf.more && !shown.length && !inf.hasMore && <p className="py-16 text-center text-ink-500">No restaurants match these filters.</p>}
    </div>
  )
}
