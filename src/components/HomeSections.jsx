import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useAsync, money } from '../utils/useAsync'
import { Rating, SectionTitle, Thumb } from './ui'
import { priceMarks, etaText } from './VendorCard'

export function Scroller({ children, className = '' }) {
  const ref = useRef(null)
  const go = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <div className="group/scroll relative">
      <div ref={ref} className={`no-scrollbar -mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 snap-x ${className}`}>{children}</div>
      {['‹', '›'].map((a, i) => (
        <button key={a} aria-label={i ? 'Scroll right' : 'Scroll left'} onClick={() => go(i ? 1 : -1)}
          className={`absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-2xl font-bold text-brand-600 shadow-card opacity-0 transition hover:bg-brand-50 group-hover/scroll:opacity-100 md:grid ${i ? '-right-4' : '-left-4'}`}>{a}</button>
      ))}
    </div>
  )
}

const FALLBACK = [
  { id: 'f1', title: 'Hungry?', subtitle: 'Order from the best local restaurants', cls: 'from-brand-500 to-pink-500 text-white', to: '/restaurants', emoji: '🍕' },
  { id: 'f2', title: 'Search by list', subtitle: 'Type items separated by commas', cls: 'from-ink-900 to-violet-700 text-white', to: '/search', emoji: '🍛' },
]
const CLS = ['from-brand-500 to-pink-500 text-white', 'from-ink-900 to-violet-700 text-white', 'from-cyan-500 to-violet-600 text-white', 'from-violet-600 to-ink-900 text-white', 'from-brand-400 to-sun-500 text-ink-900']
const bannerTo = (link = '') => (link.startsWith('/') ? link : link.startsWith('promo:') ? '/restaurants' : '/restaurants')

export function Offers({ coupons = [], banners = [] }) {
  const [copied, setCopied] = useState('')
  const copy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(''), 1500)
  }
  const promos = banners.length ? banners.map((b, i) => ({ id: b.id, title: b.title, subtitle: b.subtitle, image: b.imageUrl, to: bannerTo(b.link), code: b.link?.startsWith('promo:') ? b.link.slice(6) : null, cls: CLS[i % CLS.length], emoji: ['🍕', '🍔', '🍰'][i % 3] })) : FALLBACK
  return (
    <section>
      <SectionTitle title="Offers for you" subtitle="Tap a coupon to copy it, then apply at checkout" />
      <Scroller>
        {promos.map((p) => (
          <Link key={p.id} to={p.to} onClick={() => p.code && navigator.clipboard?.writeText(p.code).catch(() => {})} className={`relative flex h-40 w-72 shrink-0 snap-start flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-card transition hover:-translate-y-1 hover:shadow-xl sm:w-80 ${p.cls}`}>
            <span className="absolute -right-2 -top-1 text-8xl opacity-90 drop-shadow">{p.emoji}</span>
            <h3 className="max-w-[65%] font-display text-2xl font-bold leading-tight">{p.title}</h3>
            <p className="mt-1 max-w-[70%] text-sm font-medium opacity-90">{p.subtitle}</p>
          </Link>
        ))}
        {coupons.map((c) => (
          <button key={c.code} onClick={() => copy(c.code)} className="relative flex h-40 w-72 shrink-0 snap-start flex-col justify-between rounded-2xl border-2 border-dashed border-brand-300 bg-white p-6 text-left transition hover:border-brand-500 sm:w-80">
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f5f6fb]" />
            <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#f5f6fb]" />
            <p className="text-sm font-semibold text-ink-700">{c.description}</p>
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-brand-600 px-3 py-1 text-sm font-extrabold tracking-widest text-white">{c.code}</span>
              <span className="text-xs font-bold text-brand-700">{copied === c.code ? 'Copied ✓' : 'Tap to copy'}</span>
            </div>
          </button>
        ))}
      </Scroller>
    </section>
  )
}

const TINTS = [['#ece6ff', 'group-hover:ring-violet-500'], ['#d8f6fd', 'group-hover:ring-cyan-500'], ['#dcfbe9', 'group-hover:ring-teal-500'], ['#ffe6dd', 'group-hover:ring-brand-500'], ['#fff2c7', 'group-hover:ring-sun-500'], ['#e1ecff', 'group-hover:ring-sky-500']]

export function Cuisines({ cats }) {
  if (!cats?.length) return null
  return (
    <section>
      <SectionTitle title="What’s on your mind?" subtitle="Explore by cuisine" />
      <Scroller className="gap-3">
        {cats.map((c, i) => (
          <Link key={c.id} to={`/restaurants?cuisine=${encodeURIComponent(c.id)}`} className="group flex w-24 shrink-0 snap-start flex-col items-center gap-2">
            <Thumb emoji={c.emoji} bg={TINTS[i % TINTS.length][0]} src={c.iconUrl} size="text-5xl" className={`h-24 w-24 rounded-full ring-2 ring-transparent transition group-hover:-translate-y-1 group-hover:shadow-lg ${TINTS[i % TINTS.length][1]}`} />
            <span className="text-center text-sm font-bold text-ink-700 group-hover:text-brand-600">{c.name}</span>
          </Link>
        ))}
      </Scroller>
    </section>
  )
}

export function Trending({ list = [] }) {
  return (
    <section>
      <SectionTitle title="Trending now 🔥" subtitle="What everyone nearby is ordering" />
      <Scroller>
        {list.map((r, i) => (
          <Link key={r.id} to={`/restaurant/${r.slug}`} className="group relative w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10">
            <Thumb emoji={r.emoji} bg={r.bg} src={r.image} size="text-7xl" className="h-36 w-full" />
            <span className="absolute left-3 top-3 rounded-md bg-violet-600 px-2 py-0.5 font-display text-sm font-bold text-white shadow">#{i + 1}</span>
            <span className="absolute right-3 top-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{etaText(r)}</span>
            <div className="p-4">
              <h3 className="truncate font-display text-lg font-bold">{r.name}</h3>
              <p className="truncate text-sm text-ink-500">{r.cuisines.join(', ')}</p>
              <div className="mt-2 flex items-center justify-between">
                <Rating value={r.rating} />
                <span className="text-sm font-semibold text-ink-700">{priceMarks(r.priceLevel)}</span>
              </div>
            </div>
          </Link>
        ))}
      </Scroller>
    </section>
  )
}

// Signed-in customers: jump back into places they ordered from (one tap puts the same order in the cart).
export function OrderAgain() {
  const { user } = useAuth()
  const cart = useCart()
  const nav = useNavigate()
  const { data } = useAsync(() => (user ? api.listOrders({ limit: 20 }) : Promise.resolve(null)), [user?.id])
  const [busy, setBusy] = useState('')
  const seen = new Set()
  const list = (data?.data || []).filter((o) => /DELIVERED|COMPLETED/.test(o.status) && o.restaurantSlug && !seen.has(o.restaurantSlug) && seen.add(o.restaurantSlug)).slice(0, 6)
  if (!list.length) return null
  const again = async (o) => { setBusy(o.id); try { await api.reorder(o.id); await cart.restore(); nav('/cart') } catch { nav(`/${o.retail ? 'store' : 'restaurant'}/${o.restaurantSlug}`) } finally { setBusy('') } }
  return (
    <section>
      <SectionTitle title="Order again" subtitle="Your usual spots, one tap away" />
      <Scroller>
        {list.map((o) => (
          <div key={o.id} className="w-64 shrink-0 snap-start rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
            <Link to={`/${o.retail ? 'store' : 'restaurant'}/${o.restaurantSlug}`} className="block truncate font-display text-lg font-bold hover:text-brand-600">{o.restaurantName}</Link>
            <p className="mt-0.5 text-xs text-ink-500">Last order {new Date(o.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} · {money(o.total ?? o.subtotal)}</p>
            <button onClick={() => again(o)} disabled={busy === o.id} className="btn-primary mt-3 w-full !py-2 text-sm">{busy === o.id ? 'Adding…' : '↻ Reorder'}</button>
          </div>
        ))}
      </Scroller>
    </section>
  )
}

export function Highlights() {
  const items = [['⚡', 'Fast delivery', 'Hot meals from nearby kitchens in about 30 minutes.', 'bg-brand-500', 'bg-brand-50'], ['🛡️', 'Safe payments', 'Wallet credit today, cards and Apple / Google Pay soon.', 'bg-violet-500', 'bg-violet-50'], ['📍', 'Live tracking', 'Follow your order from kitchen to doorstep.', 'bg-cyan-500', 'bg-cyan-50']]
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {items.map(([e, h, p, icon, bg]) => (
        <div key={h} className={`rounded-2xl p-6 ${bg}`}>
          <div className={`grid h-12 w-12 place-items-center rounded-xl text-2xl shadow-sm ${icon}`}>{e}</div>
          <h3 className="mt-3 font-display text-lg font-bold">{h}</h3>
          <p className="mt-1 text-sm text-ink-700">{p}</p>
        </div>
      ))}
    </section>
  )
}
