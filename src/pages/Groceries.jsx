import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAsync } from '../utils/useAsync'
import { useInfinite } from '../utils/useInfinite'
import InfiniteSentinel from '../components/InfiniteSentinel'
import { useLocation2 } from '../context/LocationContext'
import VendorCard from '../components/VendorCard'
import { SectionTitle, Skeleton } from '../components/ui'

const TYPE_EMOJI = { GROCERY: '🛒', CONVENIENCE: '🏪', SPECIALTY: '🥩' }

export default function Groceries() {
  const { label, loc } = useLocation2()
  const [params, setParams] = useSearchParams()
  const type = params.get('type') || ''
  const setType = (t) => setParams(t ? { type: t } : {})
  const [openOnly, setOpenOnly] = useState(false)
  const { data: types } = useAsync(() => api.listStoreTypes('RETAIL'), [loc?.lat, loc?.lng])
  const inf = useInfinite((page) => api.listVendorsPage({ vertical: 'RETAIL', storeType: type, openNow: openOnly }, page), [type, openOnly, loc?.lat, loc?.lng])
  const shown = inf.items

  return (
    <div className="container-x py-8">
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-ink-900 p-6 text-white sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-white/80">Groceries & shops</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Stock up, delivered to your door</h1>
        <p className="mt-2 max-w-lg text-sm text-white/85">Fresh produce, pantry staples and specialty foods from stores around {label || 'you'}.</p>
      </div>
      <SectionTitle title="Stores near you" subtitle={`${inf.loading ? 'Finding' : shown.length} store${shown.length === 1 ? '' : 's'} delivering to ${label || 'your area'}`} />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        <button onClick={() => setType('')} className={`chip ${!type ? 'chip-active' : ''}`}>All</button>
        {(types || []).filter((t) => t.count > 0).map((t) => (
          <button key={t.type} onClick={() => setType(t.type)} className={`chip ${type === t.type ? 'chip-active' : ''}`}>{TYPE_EMOJI[t.type] || '🛍️'} {t.pluralLabel} <span className="text-ink-300">({t.count})</span></button>
        ))}
        <button onClick={() => setOpenOnly((v) => !v)} className={`chip ${openOnly ? 'chip-active' : ''}`}>Open now{openOnly && ' ✕'}</button>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {inf.loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />) : shown.map((s) => <VendorCard key={s.id} vendor={s} />)}
      </div>
      <InfiniteSentinel inf={inf} />
      {!inf.loading && !inf.hasMore && !shown.length && <p className="py-16 text-center text-ink-500">No stores match right now.</p>}
    </div>
  )
}
