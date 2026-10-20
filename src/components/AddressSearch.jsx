import { useEffect, useState } from 'react'
import { mapboxEnabled, searchAddress } from '../utils/mapbox'

// Street-address autocomplete (Mapbox). onPick receives { line1, city, province, postalCode, lat, lng, label }.
export default function AddressSearch({ onPick, near, placeholder = 'Search a street address', autoFocus }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const term = q.trim()

  useEffect(() => {
    if (term.length < 3 || !mapboxEnabled) return undefined
    const id = setTimeout(async () => {
      try { setRes({ q: term, list: await searchAddress(term, near) }); setErr('') } catch { setErr('Couldn’t search addresses. Check your connection.') }
    }, 300)
    return () => clearTimeout(id)
  }, [term, near?.lat, near?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!mapboxEnabled) return null
  const list = term.length >= 3 && res?.q === term ? res.list : []
  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 focus-within:border-brand-500">
        <span aria-hidden className="text-ink-300">⌕</span>
        <input autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search address" autoComplete="off" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
        {term.length >= 3 && res?.q !== term && !err && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-100 border-t-brand-500" />}
      </div>
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
      {list.length > 0 && (
        <ul className="mt-1 divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
          {list.map((p) => (
            <li key={`${p.lat},${p.lng},${p.label}`}>
              <button type="button" onClick={() => { onPick(p); setQ(''); setRes(null) }} className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-brand-50">
                <span aria-hidden className="mt-0.5">📍</span>
                <span className="min-w-0"><span className="block truncate text-sm font-semibold">{p.line1}</span><span className="block truncate text-xs text-ink-500">{[p.city, p.province, p.postalCode].filter(Boolean).join(', ')}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {term.length >= 3 && res?.q === term && !list.length && <p className="mt-1 text-xs text-ink-500">No matches for “{term}”.</p>}
    </div>
  )
}
