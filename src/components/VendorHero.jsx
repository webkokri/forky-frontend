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
  return (
    <div>
      <nav className="mb-4 text-xs text-ink-500">
        <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to={vendor.type === 'store' ? '/groceries' : '/restaurants'} className="hover:text-brand-600">{vendor.type === 'store' ? 'Groceries' : 'Restaurants'}</Link> / <span className="text-ink-900">{vendor.name}</span>
      </nav>
      <div className="grid grid-cols-[88px_1fr] gap-4 rounded-3xl border border-ink-100 bg-white p-4 shadow-card sm:grid-cols-[160px_1fr] sm:gap-6 sm:p-6">
        <Thumb emoji={vendor.emoji} bg={vendor.bg} src={vendor.logo || vendor.image} className="aspect-square w-full self-start rounded-2xl" size="text-4xl sm:text-7xl" />
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{vendor.name}</h1>
              <p className="mt-1 text-sm text-ink-500">{[vendor.type === 'store' ? vendor.storeTypeLabel : null, ...vendor.cuisines].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="flex items-center gap-2">
            <button onClick={toggleFav} aria-label={fav ? 'Remove from favourites' : 'Save to favourites'} aria-pressed={fav} className={`grid h-9 w-9 place-items-center rounded-full border text-lg ${fav ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-ink-100 text-ink-300 hover:text-brand-500'}`}>{fav ? '♥' : '♡'}</button>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${vendor.isOpen ? 'bg-mint-500/15 text-mint-600' : 'bg-rose-100 text-rose-600'}`}>{vendor.isOpen ? 'Open now' : vendor.opensAt ? `Opens ${new Date(vendor.opensAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}` : 'Closed'}</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Rating value={vendor.rating} count={vendor.ratingCount} />
            <span>⏱ <b>{etaText(vendor)}</b></span>
            {vendor.distanceKm != null && <span>📍 {vendor.distanceKm} km</span>}
            {vendor.minOrder > 0 && <span>Min order {money(vendor.minOrder)}</span>}
            <span>{vendor.deliveryAvailable === false ? 'Pickup only' : vendor.deliveryFee === 0 ? 'Free delivery' : `${money(vendor.deliveryFee)} delivery`}</span>
          </div>
          {vendor.offer && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">🏷️ {vendor.offer}</div>
          )}
        </div>
      </div>
      {vendor.promos?.length > 0 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
          {vendor.promos.map((p) => (
            <div key={p.id} className="shrink-0 rounded-xl border border-dashed border-brand-300 bg-white px-4 py-2 text-xs"><b className="text-brand-700">{p.code}</b><div className="text-ink-500">{p.description || p.label}</div></div>
          ))}
        </div>
      )}
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
