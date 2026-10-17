import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useAsync, money } from '../utils/useAsync'
import VendorHero, { VendorInfo } from '../components/VendorHero'
import Tabs from '../components/Tabs'
import Reviews from '../components/Reviews'
import Gallery from '../components/Gallery'
import { useLocation2 } from '../context/LocationContext'
import { AddButton, ErrorState, Skeleton, Thumb, VegMark } from '../components/ui'

function ProductCard({ item, vendor }) {
  return (
    <div className="flex flex-col rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
      <div className="relative">
        <Thumb emoji={item.emoji} bg={item.bg} src={item.image} className="aspect-square w-full rounded-xl" size="text-5xl" />
        {item.lowStock && item.inStock && <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">Low stock</span>}
        {item.ageRestricted && <span className="absolute right-2 top-2 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-white">{item.minAge}+</span>}
      </div>
      {item.brand && <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-brand-600">{item.brand}</div>}
      <h4 className={`${item.brand ? '' : 'mt-2 '}text-sm font-semibold leading-snug`}>{item.name}</h4>
      <p className="text-xs text-ink-500">{item.byWeight ? `${item.unit} · ${item.perUnit}` : item.unit}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="text-sm font-extrabold">{money(item.price)}</span>
        <AddButton vendor={vendor} item={item} disabled={!vendor.isOpen || !item.available} compact />
      </div>
    </div>
  )
}

function MenuItem({ item, vendor }) {
  return (
    <div className="flex gap-4 py-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <VegMark veg={item.veg} />
          {item.bestseller && <span className="text-xs font-bold text-amber-600">★ Popular</span>}
        </div>
        <h4 className="mt-1 text-base font-bold">{item.name}</h4>
        <div className="text-sm font-semibold">{money(item.price)}</div>
        <p className="mt-2 line-clamp-2 text-sm text-ink-500">{item.description}</p>
      </div>
      <div className="relative w-32 shrink-0 sm:w-36">
        <Thumb emoji={item.emoji} bg={item.bg} src={item.image} className="aspect-square w-full rounded-2xl" size="text-5xl" />
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2"><AddButton vendor={vendor} item={item} disabled={!vendor.isOpen || !item.available} /></div>
      </div>
    </div>
  )
}

export default function RestaurantPage() {
  const { slug } = useParams()
  const { loc } = useLocation2()
  const { data: r, loading, error } = useAsync(() => api.getRestaurant(slug), [slug, loc?.lat, loc?.lng])
  const [tab, setTab] = useState('menu')
  const [vegOnly, setVegOnly] = useState(false)
  const [q, setQ] = useState('')

  const isStore = r?.type === 'store'
  const menu = useMemo(() => (r?.menu || []).map((c) => ({
    ...c,
    items: c.items.filter((i) => (!vegOnly || i.veg) && i.name.toLowerCase().includes(q.toLowerCase())),
  })).filter((c) => c.items.length), [r, vegOnly, q])

  if (error) return <ErrorState error={error} />
  if (loading) return <div className="container-x space-y-4 py-8"><Skeleton className="h-48" /><Skeleton className="h-96" /></div>

  return (
    <div className="container-x py-6">
      <VendorHero vendor={r} />
      <div className="mt-6">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'menu', label: 'Menu' }, { id: 'reviews', label: 'Reviews', count: r.reviews.length }, ...(r.gallery.length ? [{ id: 'gallery', label: 'Photos', count: r.gallery.length }] : []), { id: 'info', label: 'Info' }]} />
      </div>

      <div className="pt-6">
        {tab === 'menu' && (
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <aside className="hidden lg:block">
              <ul className="sticky top-32 space-y-1 border-r border-ink-100 pr-4">
                {menu.map((c) => (
                  <li key={c.id}><a href={`#${c.id}`} className="block rounded-lg px-3 py-2 text-right text-sm font-semibold text-ink-700 hover:bg-brand-50 hover:text-brand-700">{c.name} <span className="text-ink-300">({c.items.length})</span></a></li>
                ))}
              </ul>
            </aside>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isStore ? `Search ${r?.itemLabel || 'products'}` : 'Search in menu'} className="h-10 flex-1 rounded-xl border border-ink-100 px-3 text-sm outline-none focus:border-brand-400" />
                <button onClick={() => setVegOnly((v) => !v)} className={`chip ${vegOnly ? 'chip-active' : ''}`}><VegMark veg /> {isStore ? 'Vegan / veg' : 'Veg only'}</button>
              </div>
              {menu.map((c) => (
                <section key={c.id} id={c.id} className="scroll-mt-32 border-b-8 border-ink-100/60 pb-2 pt-4 last:border-0">
                  <h3 className="text-lg font-extrabold">{c.name} <span className="font-medium text-ink-300">({c.items.length})</span></h3>
                  {isStore
                    ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{c.items.map((i) => <ProductCard key={i.id} item={i} vendor={r} />)}</div>
                    : <div className="divide-y divide-ink-100">{c.items.map((i) => <MenuItem key={i.id} item={i} vendor={r} />)}</div>}
                </section>
              ))}
              {!menu.length && <p className="py-12 text-center text-ink-500">No dishes match.</p>}
            </div>
          </div>
        )}
        {tab === 'reviews' && <Reviews vendor={r} />}
        {tab === 'gallery' && <Gallery items={r.gallery} />}
        {tab === 'info' && <VendorInfo vendor={r} />}
      </div>
    </div>
  )
}
