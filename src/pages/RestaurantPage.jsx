import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAsync, money } from '../utils/useAsync'
import VendorHero, { VendorInfo } from '../components/VendorHero'
import Reviews from '../components/Reviews'
import Gallery from '../components/Gallery'
import { useCart } from '../context/CartContext'
import { useLocation2 } from '../context/LocationContext'
import { AddButton, ErrorState, Skeleton, Thumb, VegMark } from '../components/ui'

const STICKY = 'top-[6.25rem] lg:top-16'

// ---- cards -------------------------------------------------------------------------------------
function ProductCard({ item, vendor }) {
  const off = !vendor.isOpen || !item.available
  return (
    <div className={`flex flex-col rounded-2xl border border-ink-100 bg-white p-3 shadow-card transition hover:border-violet-200 ${off ? 'opacity-70' : ''}`}>
      <div className="relative">
        <Thumb emoji={item.emoji} bg={item.bg} src={item.image} className="aspect-square w-full rounded-xl" size="text-5xl" />
        {item.lowStock && item.inStock && <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">Low stock</span>}
        {item.ageRestricted && <span className="absolute right-2 top-2 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold text-white">{item.minAge}+</span>}
      </div>
      {item.brand && <div className="mt-2 text-[11px] font-bold uppercase tracking-wide text-violet-600">{item.brand}</div>}
      <h4 className={`${item.brand ? '' : 'mt-2 '}text-sm font-semibold leading-snug`}>{item.name}</h4>
      <p className="text-xs text-ink-500">{item.byWeight ? `${item.unit} · ${item.perUnit}` : item.unit}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="text-base font-extrabold">{money(item.price)}</span>
        <AddButton vendor={vendor} item={item} disabled={off} compact />
      </div>
    </div>
  )
}

function DishCard({ item, vendor }) {
  const off = !vendor.isOpen || !item.available
  return (
    <article className={`flex gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition hover:border-violet-200 ${off ? 'opacity-70' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <VegMark veg={item.veg} />
          {item.bestseller && <span className="rounded-full bg-sun-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sun-700">★ Popular</span>}
          {item.calories > 0 && <span className="text-[11px] text-ink-500">{item.calories} cal</span>}
        </div>
        <h4 className="mt-1.5 font-display text-lg font-bold leading-snug">{item.name}</h4>
        <div className="mt-0.5 text-base font-extrabold text-brand-600">{money(item.price)}</div>
        {item.description && <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{item.description}</p>}
        {item.allergens?.length > 0 && <p className="mt-1.5 text-[11px] text-ink-500">Contains: {item.allergens.join(', ')}</p>}
      </div>
      <div className="relative w-28 shrink-0 sm:w-32">
        <Thumb emoji={item.emoji} bg={item.bg} src={item.image} className="aspect-square w-full rounded-xl" size="text-5xl" />
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 shadow-lg"><AddButton vendor={vendor} item={item} disabled={off} compact /></div>
      </div>
    </article>
  )
}

// ---- cart panel (desktop) ------------------------------------------------------------------------
function CartPanel({ vendor }) {
  const cart = useCart()
  const mine = cart.vendor?.id === vendor.id
  const short = mine && vendor.minOrder > 0 ? Math.max(0, vendor.minOrder - cart.subtotal) : 0
  const pct = mine && vendor.minOrder > 0 ? Math.min(100, (cart.subtotal / vendor.minOrder) * 100) : 100
  return (
    <aside className={`sticky ${STICKY} hidden self-start rounded-2xl border border-ink-100 bg-white p-5 shadow-card lg:block`}>
      <h3 className="font-display text-lg font-bold">Your order</h3>
      {mine && cart.count > 0 ? (
        <>
          <ul className="mt-3 max-h-72 divide-y divide-ink-100 overflow-y-auto">
            {cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-2 py-2.5 text-sm">
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{i.name}</div>{(i.optionsLabel || i.unit) && <div className="truncate text-xs text-ink-500">{i.optionsLabel || i.unit}</div>}</div>
                <AddButton vendor={vendor} item={i} compact />
                <div className="w-14 text-right font-semibold">{money(i.price * i.qty)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-ink-100 pt-3 font-bold"><span>Subtotal</span><span>{money(cart.subtotal)}</span></div>
          {vendor.minOrder > 0 && (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all" style={{ width: `${pct}%` }} /></div>
              <p className="mt-1.5 text-xs text-ink-500">{short > 0 ? `Add ${money(short)} more to reach the ${money(vendor.minOrder)} minimum` : 'Minimum order reached 🎉'}</p>
            </div>
          )}
          <Link to="/cart" className="btn-primary mt-4 w-full py-3">Go to checkout →</Link>
        </>
      ) : (
        <div className="py-6 text-center"><div className="text-4xl">{cart.count > 0 ? '🛒' : '🍽️'}</div><p className="mt-2 text-sm text-ink-500">{cart.count > 0 ? `Your cart has items from ${cart.vendor?.name}. Adding here starts a new cart.` : 'Add something delicious to get started.'}</p></div>
      )}
    </aside>
  )
}

// ---- page ------------------------------------------------------------------------------------------
export default function RestaurantPage() {
  const { slug } = useParams()
  const { loc } = useLocation2()
  const { data: r, loading, error } = useAsync(() => api.getRestaurant(slug), [slug, loc?.lat, loc?.lng])
  const [tab, setTab] = useState('menu')
  const [vegOnly, setVegOnly] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState('')
  const barRef = useRef(null)

  const isStore = r?.type === 'store'
  const searching = q.trim() !== '' || vegOnly
  const menu = useMemo(() => (r?.menu || []).map((c) => ({ ...c, items: c.items.filter((i) => (!vegOnly || i.veg) && i.name.toLowerCase().includes(q.trim().toLowerCase())) })).filter((c) => c.items.length), [r, vegOnly, q])
  const popular = !searching ? (r?.popular || []).filter((i) => i.available).slice(0, 8) : []

  // Highlight the category that is on screen
  useEffect(() => {
    if (tab !== 'menu' || !menu.length) return undefined
    const io = new IntersectionObserver((es) => { const v = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (v) setActive(v.target.id.replace('cat-', '')) }, { rootMargin: '-140px 0px -65% 0px' })
    menu.forEach((c) => { const el = document.getElementById(`cat-${c.id}`); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [menu, tab])
  useEffect(() => { barRef.current?.querySelector('[data-on="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) }, [active])
  const jump = (id) => document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  if (error) return <ErrorState error={error} />
  if (loading) return <div className="space-y-4"><Skeleton className="h-56 rounded-none" /><div className="container-x space-y-4"><Skeleton className="h-40" /><Skeleton className="h-96" /></div></div>

  const tabs = [{ id: 'menu', label: isStore ? 'Shop' : 'Menu' }, { id: 'reviews', label: 'Reviews', count: r.reviews.length }, ...(r.gallery.length ? [{ id: 'gallery', label: 'Photos', count: r.gallery.length }] : []), { id: 'info', label: 'Info' }]

  return (
    <div className="pb-8">
      <VendorHero vendor={r} />
      {!r.isOpen && <div className="container-x mt-4"><p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">This {isStore ? 'store' : 'restaurant'} is closed right now. You can browse{r.opensAt ? `, and it opens at ${new Date(r.opensAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}` : ''}.</p></div>}

      <div className="container-x mt-6">
        <div role="tablist" className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-card ring-1 ring-ink-100">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-bold transition ${tab === t.id ? 'bg-ink-900 text-white shadow' : 'text-ink-700 hover:text-brand-600'}`}>{t.label}{t.count != null && <span className="ml-1.5 text-xs opacity-60">{t.count}</span>}</button>
          ))}
        </div>

        {tab === 'menu' && (
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {/* sticky toolbar: categories + search + veg */}
              <div className={`sticky ${STICKY} z-20 -mx-4 border-b border-ink-100 bg-[#f5f6fb]/90 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:bg-white/90 sm:px-4`}>
                <div className="flex items-center gap-2">
                  <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 focus-within:border-violet-500">
                    <span aria-hidden className="text-ink-300">⌕</span>
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={isStore ? `Search ${r.itemLabel || 'products'}` : 'Search this menu'} aria-label="Search menu" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                    {q && <button onClick={() => setQ('')} aria-label="Clear search" className="text-ink-300 hover:text-ink-900">✕</button>}
                  </label>
                  <button onClick={() => setVegOnly((v) => !v)} aria-pressed={vegOnly} className={`chip h-10 shrink-0 ${vegOnly ? 'chip-active' : ''}`}><VegMark veg /> <span className="hidden sm:inline">{isStore ? 'Vegan / veg' : 'Veg only'}</span></button>
                </div>
                {menu.length > 1 && (
                  <div ref={barRef} className="no-scrollbar -mx-1 mt-2.5 flex gap-1.5 overflow-x-auto px-1">
                    {menu.map((c) => <button key={c.id} data-on={active === c.id} onClick={() => jump(c.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${active === c.id ? 'bg-brand-500 text-white shadow' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:ring-violet-300'}`}>{c.name}</button>)}
                  </div>
                )}
              </div>

              {popular.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-3 flex items-center gap-2 font-display text-xl font-bold"><span aria-hidden className="h-5 w-1.5 rounded-full bg-gradient-to-b from-brand-500 to-violet-500" />Popular right now</h3>
                  <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                    {popular.map((i) => (
                      <div key={i.id} className="w-44 shrink-0 rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
                        <Thumb emoji={i.emoji} bg={i.bg} src={i.image} className="aspect-[4/3] w-full rounded-xl" size="text-4xl" />
                        <div className="mt-2 truncate text-sm font-bold">{i.name}</div>
                        <div className="mt-1 flex items-center justify-between"><span className="text-sm font-extrabold">{money(i.price)}</span><AddButton vendor={r} item={i} disabled={!r.isOpen} compact /></div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {menu.map((c) => (
                <section key={c.id} id={`cat-${c.id}`} className="mt-8 scroll-mt-48">
                  <h3 className="mb-4 flex items-baseline gap-2 font-display text-2xl font-bold">{c.name}<span className="text-sm font-medium text-ink-300">{c.items.length} {c.items.length === 1 ? 'item' : 'items'}</span></h3>
                  {isStore
                    ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{c.items.map((i) => <ProductCard key={i.id} item={i} vendor={r} />)}</div>
                    : <div className="grid gap-4 xl:grid-cols-2">{c.items.map((i) => <DishCard key={i.id} item={i} vendor={r} />)}</div>}
                </section>
              ))}
              {!menu.length && <div className="mt-10 rounded-2xl border border-dashed border-ink-300 p-12 text-center"><div className="text-4xl">🔍</div><p className="mt-2 text-ink-500">Nothing matches “{q}”.</p><button onClick={() => { setQ(''); setVegOnly(false) }} className="btn-ghost mt-4">Clear filters</button></div>}
            </div>
            <CartPanel vendor={r} />
          </div>
        )}
        <div className="mt-6">
          {tab === 'reviews' && <Reviews vendor={r} />}
          {tab === 'gallery' && <Gallery items={r.gallery} />}
          {tab === 'info' && <VendorInfo vendor={r} />}
        </div>
      </div>
    </div>
  )
}
