import { Link } from 'react-router-dom'
import { Rating, Thumb } from './ui'
import { money } from '../utils/useAsync'

export const priceMarks = (n) => (n ? '$'.repeat(Math.min(n, 4)) : '')
export const etaText = (v) => (v.etaMax && v.etaMax !== v.etaMins ? `${v.etaMins}–${v.etaMax} min` : `${v.etaMins} min`)

export default function VendorCard({ vendor }) {
  return (
    <Link to={`/${vendor.type === 'store' ? 'store' : 'restaurant'}/${vendor.slug}`} className="group block overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10">
      <div className="relative overflow-hidden">
        <Thumb emoji={vendor.emoji} bg={vendor.bg} src={vendor.image} size="text-7xl" className="aspect-[4/3] w-full transition duration-300 group-hover:scale-105" />
        <span className="absolute right-3 top-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{etaText(vendor)}</span>
        {vendor.isNew && <span className="absolute left-3 top-3 rounded-full bg-teal-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">New</span>}
        {vendor.offer && <div className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-md bg-sun-300 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-900 shadow">🏷️ {vendor.offer}</div>}
        {!vendor.isOpen && (
          <div className="absolute inset-0 grid place-items-center bg-white/75 text-center text-sm font-bold text-ink-700">
            <span>Closed now{vendor.opensAt && <span className="block text-xs font-semibold text-ink-500">Opens {new Date(vendor.opensAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}</span>}</span>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display text-lg font-bold">{vendor.name}</h3>
          <Rating value={vendor.rating} className="shrink-0" />
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-500">{[vendor.type === 'store' ? vendor.storeTypeLabel : null, priceMarks(vendor.priceLevel), vendor.cuisines.join(', ')].filter(Boolean).join(' · ')}</p>
        <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-2 text-xs font-semibold text-ink-500">
          <span>📍 {vendor.distanceKm != null ? `${vendor.distanceKm} km` : vendor.area}</span>
          <span className="text-ink-700">{vendor.deliveryAvailable === false ? 'Pickup only' : vendor.deliveryFee === 0 ? 'Free delivery' : `${money(vendor.deliveryFee)} delivery`}</span>
        </div>
      </div>
    </Link>
  )
}
