import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api'

// Delivery location. Detected from the browser's GPS and resolved to a service
// zone/city by the API (/public/zones/resolve), or picked from /public/cities.
// lat/lng are read by src/api/real.js so every discovery request is location-aware.
const STORAGE_KEY = 'forksy_location'
const Ctx = createContext(null)

const read = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null } }

// Used only to name an address outside our service area.
async function nameFromCoords(lat, lng) {
  try {
    const d = await (await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)).json()
    return d.city || d.locality || d.principalSubdivision || ''
  } catch { return '' }
}

export function LocationProvider({ children }) {
  const [loc, setLoc] = useState(read)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState('')
  const [cities, setCities] = useState([])

  const save = useCallback((next) => {
    setLoc(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  useEffect(() => { api.listCities().then(setCities).catch(() => {}) }, [])

  const detect = useCallback(() => {
    if (!navigator.geolocation) { setStatus('error'); setError('Location is not supported in this browser'); return }
    setStatus('loading'); setError('')
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const z = await api.resolveZone(lat, lng)
          if (z.serviceable) {
            save({ lat, lng, city: z.city.name, area: z.zone.name, label: `${z.zone.name}, ${z.city.name}`, serviceable: true, auto: true })
          } else {
            const city = await nameFromCoords(lat, lng)
            save({ lat, lng, city, area: '', label: city || 'Your location', serviceable: false, auto: true })
          }
          setStatus('idle')
        } catch (e) { setStatus('error'); setError(e.message) }
      },
      (e) => { setStatus('error'); setError(e.code === 1 ? 'Location permission denied. Choose an area below.' : 'Could not get your location') },
      { timeout: 10000, maximumAge: 600000 },
    )
  }, [save])

  // A street address picked by the customer (e.g. ordering for someone else), with optional notes for the courier.
  const selectCustom = useCallback(async (place, notes) => {
    let z = null
    try { z = await api.resolveZone(place.lat, place.lng) } catch { /* keep going without zone info */ }
    save({ lat: place.lat, lng: place.lng, city: z?.city?.name || place.city, area: z?.zone?.name || '', label: place.label, line1: place.line1, postalCode: place.postalCode, province: place.province, serviceable: z ? !!z.serviceable : true, custom: true, notes: notes || undefined, auto: false })
    setStatus('idle'); setError('')
  }, [save])

  const selectZone = useCallback((city, zone) => {
    save({ lat: zone.centerLat, lng: zone.centerLng, city: city.name, area: zone.name, label: `${zone.name}, ${city.name}`, serviceable: true, auto: false })
    setStatus('idle'); setError('')
  }, [save])

  // First visit: ask once for the real location.
  useEffect(() => { if (!read()) detect() }, [detect])

  const value = useMemo(() => ({ loc, label: loc?.label || '', city: loc?.city || '', serviceable: loc?.serviceable !== false, cities, status, error, detect, selectZone, selectCustom }), [loc, cities, status, error, detect, selectZone, selectCustom])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useLocation2 = () => useContext(Ctx)
