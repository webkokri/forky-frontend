import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { Rating, Thumb } from './ui'
import { money } from '../utils/useAsync'
import { etaText } from './VendorCard'

export default function VendorHero({ vendor }) {
  const { user } = useAuth()
  const nav = useNavigate()
  const [fav, setFav] = useState(!!vendor.isFavorite)
  const toggleFav = async () => {
    if (!user) return nav(`/login?next=${encodeURIComponent(window.location.pathname)}`)
    const next = !fav
    setFav(next)
    try { await (next ? api.addFavorite(vendor.id) : api.removeFavorite(vendor.id)) } catch { setFav(!next) }
  }
  const store = vendor.type === 'store'
  const delivery = vendor.deliveryAvailable === false ? 'Pickup only' : vendor.deliveryFee === 0 ? 'Free delivery' : `${money(vendor.deliveryFee)} delivery`
  const status = vendor.isOpen ? 'Open now' : vendor.opensAt ? `Opens ${new Date(vendor.opensAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}` : 'Closed'
  return (
    <div>
      {/* Banner: cover photo when there is one, otherwise the brand gradient */}
      <div className="relative h-40 overflow-hidden bg-ink-900 sm:h-56">
        {vendor.image ? <img src={vendor.image} alt="" className="h-full w-full object-cover opacity-80" /> : (
          <>
            <div className="absolute inset-0 [background:radial-gradient(circle_at_85%_20%,rgba(124,92,255,.55),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(238,80,52,.5),transparent_45%)]" />
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:40px_40px]" />
            <span aria-hidden className="absolute -bottom-6 right-6 text-[9rem] opacity-90 drop-shadow-2xl sm:right-16 sm:text-[12rem]">{vendor.emoji}</span>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-transparent to-transparent" />
        <nav className="container-x absolute inset-x-0 top-0 pt-4 text-xs font-medium text-white/80">
          <Link to="/" className="hover:text-white">Home</Link> / <Link to={store ? '/groceries' : '/restaurants'} className="hover:text-white">{store ? 'Groceries' : 'Restaurants'}</Link> / <span className="text-white">{vendor.name}</span>
        </nav>
      </div>

      <div className="container-x">
        <div className="relative -mt-14 rounded-3xl border border-ink-100 bg-white p-4 shadow-card sm:-mt-16 sm:p-6">
          <div className="flex gap-4 sm:gap-6">
            <Thumb emoji={vendor.emoji} bg={vendor.bg} src={vendor.logo} className="-mt-12 h-20 w-20 shrink-0 rounded-2xl ring-4 ring-white sm:-mt-14 sm:h-28 sm:w-28" size="text-4xl sm:text-6xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl">{vendor.name}</h1>
                  <p className="mt-1 text-sm text-ink-500">{[store ? vendor.storeTypeLabel : null, ...vendor.cuisines].filter(Boolean).join(' · ')}</p>
                </div>
                <button onClick={toggleFav} aria-label={fav ? 'Remove from favourites' : 'Save to favourites'} aria-pressed={fav} className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xl transition ${fav ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-ink-100 text-ink-300 hover:text-brand-500'}`}>{fav ? '♥' : '♡'}</button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${vendor.isOpen ? 'bg-teal-100 text-teal-700' : 'bg-rose-100 text-rose-600'}`}>● {status}</span>
            <span className="rounded-full bg-cream px-3 py-1 font-semibold"><Rating value={vendor.rating} count={vendor.ratingCount} /></span>
            <span className="rounded-full bg-cream px-3 py-1 font-semibold">⏱ {etaText(vendor)}</span>
            {vendor.distanceKm != null && <span className="rounded-full bg-cream px-3 py-1 font-semibold">📍 {vendor.distanceKm} km</span>}
            <span className="rounded-full bg-cream px-3 py-1 font-semibold">🛵 {delivery}</span>
            {vendor.minOrder > 0 && <span className="rounded-full bg-cream px-3 py-1 font-semibold">Min {money(vendor.minOrder)}</span>}
          </div>

          {(vendor.offer || vendor.promos?.length > 0) && (
            <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
              {vendor.offer && <span className="shrink-0 rounded-xl bg-sun-300 px-3 py-2 text-xs font-extrabold text-ink-900">🏷️ {vendor.offer}</span>}
              {(vendor.promos || []).map((p) => (
                <span key={p.id} className="shrink-0 rounded-xl border border-dashed border-violet-300 bg-violet-50 px-3 py-2 text-xs"><b className="text-violet-700">{p.code}</b> <span className="text-ink-700">{p.description || p.label}</span></span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function VendorInfo({ vendor }) {
  const rows = [['About', vendor.description], ['Address', vendor.address], ['Hours', vendor.hours], ['Phone', vendor.phone], ['Pickup', vendor.pickupInstructions]].filter(([, v]) => v)
  return (
    <dl className="grid max-w-2xl gap-5">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 sm:grid-cols-[120px_1fr]"><dt className="text-sm font-bold">{k}</dt><dd className="text-sm text-ink-700">{v}</dd></div>
      ))}
      {vendor.weekly?.length > 0 && (
        <div className="grid gap-1 text-sm sm:grid-cols-[120px_1fr]"><dt className="font-bold">Opening hours</dt><dd><ul>{vendor.weekly.map(([d, t]) => <li key={d} className="flex max-w-xs justify-between text-ink-700"><span>{d}</span><span>{t}</span></li>)}</ul></dd></div>
      )}
      {vendor.address && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vendor.name} ${vendor.address}`)}`} target="_blank" rel="noreferrer" className="btn-ghost w-fit">📍 Open in Maps</a>}
    </dl>
  )
}
