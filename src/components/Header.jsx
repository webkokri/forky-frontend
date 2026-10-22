import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useLocation2 } from '../context/LocationContext'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'
import { useMode } from '../context/ModeContext'
import { api } from '../api'
import { useAsync } from '../utils/useAsync'
import AddressSearch from './AddressSearch'

// Logo from the website settings (branding.logo); the bundled icon + wordmark is the fallback.
export function Logo({ dark }) {
  const { site } = useSite()
  const b = site?.branding || {}
  const name = site?.site?.name || 'Forky'
  const src = (dark && b.logoDark) || b.logo
  if (src) return <Link to="/" className="flex items-center" aria-label={name}><img src={src} alt={b.logoAlt || name} className="h-10 w-auto max-w-[200px] object-contain" /></Link>
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src={b.logoSquare || '/logo.png'} alt={b.logoAlt || name} className="h-10 w-10 object-contain" />
      <span className="font-brand text-2xl uppercase leading-none tracking-wide text-brand-500 sm:text-3xl">{name}</span>
    </Link>
  )
}

function LocationPicker({ mobile }) {
  const { label, loc, status, error, cities, detect, selectZone, selectCustom, serviceable } = useLocation2()
  const { pickup } = useMode()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState(null)
  const [notes, setNotes] = useState('')
  const text = status === 'loading' ? 'Detecting…' : (mobile && loc?.area && !loc?.custom ? loc.area : label) || 'Select location'
  const close = () => { setOpen(false); setPicked(null); setNotes('') }
  return (
    <div className={mobile ? 'relative shrink-0' : 'relative hidden lg:block'}>
      <button onClick={() => (open ? close() : setOpen(true))} className={mobile ? 'flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700' : 'flex items-center gap-1 whitespace-nowrap text-left'} title="Delivery location" aria-expanded={open}>
        {!mobile && <span className="text-xs text-ink-500">{pickup ? 'Pick up near' : 'Deliver to'}</span>}
        <span className={`truncate text-sm font-bold ${mobile ? 'max-w-[8rem]' : 'max-w-[200px]'}`}>📍 {text} ▾</span>
      </button>
      {open && (
        <div className={`absolute left-0 top-full z-40 mt-2 rounded-2xl border border-ink-100 bg-white p-4 shadow-xl ${mobile ? 'w-[calc(100vw-2rem)] max-w-sm' : 'w-80'}`}>
          {picked ? (
            <div>
              <div className="flex items-start gap-3 rounded-xl bg-cream p-3"><span aria-hidden>📍</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{picked.line1}</div><div className="text-xs text-ink-500">{[picked.city, picked.province, picked.postalCode].filter(Boolean).join(', ')}</div></div><button onClick={() => setPicked(null)} className="text-xs font-bold text-brand-600">Change</button></div>
              <label className="mt-3 block text-xs font-semibold">Unit, buzzer or recipient <span className="font-normal text-ink-500">· optional</span>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={120} placeholder="e.g. Apt 12, ring Sam’s bell" className="mt-1 h-10 w-full rounded-xl border border-ink-100 px-3 text-sm outline-none focus:border-brand-500" /></label>
              <button onClick={async () => { await selectCustom(picked, notes.trim()); close() }} className="btn-primary mt-3 w-full">{pickup ? 'Use this address' : 'Deliver here'}</button>
            </div>
          ) : (
            <>
              <AddressSearch autoFocus near={loc} onPick={setPicked} />
              <button onClick={() => { detect(); close() }} className="btn-primary mt-3 w-full">◎ Use my current location</button>
              {!serviceable && <p className="mt-2 text-xs text-rose-600">We don’t deliver to this location yet. Pick an area below.</p>}
              {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
              {loc?.custom && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs text-brand-700">Using <b>{loc.label}</b>{loc.notes ? ` · ${loc.notes}` : ''}</p>}
              <div className="mt-3 max-h-56 space-y-3 overflow-y-auto">
                {cities.map((c) => (
                  <div key={c.id}>
                    <div className="text-xs font-bold uppercase tracking-wider text-ink-500">{c.name}, {c.province}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">{c.zones.map((z) => <button key={z.id} onClick={() => { selectZone(c, z); close() }} className="chip !px-3 !py-1 text-xs">{z.name}</button>)}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Bell() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { data } = useAsync(() => (user ? api.unreadCount().catch(() => null) : Promise.resolve(null)), [user?.id, pathname])
  if (!user) return null
  const n = data?.count ?? data?.unread ?? 0
  return (
    <Link to="/account/notifications" aria-label={n ? `${n} unread notifications` : 'Notifications'} className="relative ml-1 grid h-10 w-10 place-items-center rounded-full text-xl hover:bg-brand-50">
      <span aria-hidden>🔔</span>
      {n > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{n > 9 ? '9+' : n}</span>}
    </Link>
  )
}

function Account() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user) return <Link to="/login" className="ml-1 whitespace-nowrap rounded-xl border border-ink-100 px-3 py-2 text-sm font-semibold hover:border-brand-500 hover:text-brand-600">Sign in</Link>
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Account" className="ml-1 grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{(user.firstName || user.name || '?')[0].toUpperCase()}</button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-52 rounded-2xl border border-ink-100 bg-white p-2 shadow-xl" onClick={() => setOpen(false)}>
          <div className="px-3 py-2 text-sm"><div className="truncate font-bold">{user.name}</div><div className="truncate text-xs text-ink-500">{user.email}</div></div>
          <Link to="/account" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-50">Dashboard</Link>
          <Link to="/account/orders" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-50">Orders</Link>
          <Link to="/account/payments" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-50">Payments & wallet</Link>
          <Link to="/account/profile" className="block rounded-lg px-3 py-2 text-sm font-semibold hover:bg-brand-50">Profile</Link>
          <button onClick={logout} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">Sign out</button>
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const { count } = useCart()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:text-brand-600'}`
  const pill = ({ isActive }) => `shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-ink-700 ring-1 ring-ink-100'}`

  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="container-x flex h-14 items-center gap-3 lg:h-16 lg:gap-4">
        <Logo />
        <LocationPicker />
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`) }} className="relative ml-auto hidden flex-1 md:block lg:max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300">⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes, restaurants or groceries" className="h-10 w-full rounded-xl border border-ink-100 bg-ink-100/40 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white" />
        </form>
        <nav className="ml-auto flex items-center gap-1 lg:ml-0">
          <NavLink to="/restaurants" className={(a) => `${link(a)} hidden lg:inline-flex`}>Food</NavLink>
          <NavLink to="/groceries" className={(a) => `${link(a)} hidden lg:inline-flex`}>Groceries</NavLink>
          <Link to="/cart" aria-label={`Cart, ${count} items`} className="relative ml-1 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500 px-3 text-sm font-semibold text-white hover:bg-brand-600">
            <span aria-hidden>🛍️</span>
            <span className="hidden lg:inline">Cart</span>
            {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-xs font-bold text-brand-600">{count}</span>}
          </Link>
          <Bell />
          <Account />
        </nav>
      </div>

      {/* Phones and tablets: location + main menu on their own row under the logo bar */}
      <div className="border-t border-ink-100 bg-cream/60 lg:hidden">
        <div className="container-x flex items-center gap-2 py-2">
          <LocationPicker mobile />
          <nav aria-label="Main" className="no-scrollbar -mr-4 flex flex-1 items-center gap-2 overflow-x-auto pr-4">
            <NavLink to="/restaurants" className={pill}>🍽️ Food</NavLink>
            <NavLink to="/groceries" className={pill}>🛒 Groceries</NavLink>
            <NavLink to="/search" className={pill}>🔍 Search</NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}
