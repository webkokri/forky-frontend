// Address search with the Mapbox Geocoding API v6 (same as the Forky mobile app).
// Needs a PUBLIC token (pk.…) in VITE_MAPBOX_TOKEN; without it address search is simply hidden.
const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
const BASE = 'https://api.mapbox.com/search/geocode/v6'
export const mapboxEnabled = TOKEN.length > 0

const toPlace = (f) => {
  const p = f?.properties
  const c = p?.coordinates ?? { latitude: f?.geometry?.coordinates?.[1], longitude: f?.geometry?.coordinates?.[0] }
  if (!p || c.latitude == null || c.longitude == null) return null
  const ctx = p.context ?? {}
  const line1 = ctx.address?.name ?? p.name
  const city = ctx.place?.name ?? ctx.locality?.name ?? ctx.district?.name ?? ''
  return { label: [line1, city].filter(Boolean).join(', '), line1, city, province: ctx.region?.region_code ?? 'ON', postalCode: ctx.postcode?.name ?? '', lat: c.latitude, lng: c.longitude }
}

async function get(path, params) {
  if (!mapboxEnabled) return []
  const q = new URLSearchParams({ access_token: TOKEN, language: 'en', ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) })
  const res = await fetch(`${BASE}${path}?${q}`)
  if (!res.ok) throw new Error('Address search failed')
  return (await res.json()).features.map(toPlace).filter(Boolean)
}

/** Autocomplete, biased towards `near` ({lat, lng}). */
export const searchAddress = (q, near) => get('/forward', { q, autocomplete: 'true', country: 'ca', limit: 6, types: 'address,street,place,neighborhood', proximity: near?.lat != null && near?.lng != null ? `${near.lng},${near.lat}` : 'ip' })
export const reverseGeocode = async (lat, lng) => (await get('/reverse', { longitude: lng, latitude: lat, types: 'address', limit: 1 }))[0] ?? null
