// Simple route map for an order: restaurant -> customer, with the courier's live position.
// Drawn in SVG from the coordinates in the tracking data (no map tiles needed).
export default function TrackingMap({ restaurant, dropoff, driver, delivered }) {
  const pts = [restaurant, dropoff, driver].filter((p) => p?.lat != null && p?.lng != null)
  if (pts.length < 2) return null
  const lats = pts.map((p) => p.lat), lngs = pts.map((p) => p.lng)
  const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
  const W = 360, H = 200, pad = 36
  const spanLat = Math.max(maxLat - minLat, 0.004), spanLng = Math.max(maxLng - minLng, 0.004)
  const k = Math.min((W - 2 * pad) / spanLng, (H - 2 * pad) / spanLat)
  const cx = (minLng + maxLng) / 2, cy = (minLat + maxLat) / 2
  const at = (p) => ({ x: W / 2 + (p.lng - cx) * k, y: H / 2 - (p.lat - cy) * k })
  const r = restaurant && at(restaurant), c = dropoff && at(dropoff), d = driver && at(driver)
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-sky-50">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Order route map" className="block h-auto w-full">
        <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#c7e6ff" strokeWidth="1" /></pattern></defs>
        <rect width={W} height={H} fill="url(#grid)" />
        {r && c && <line x1={r.x} y1={r.y} x2={c.x} y2={c.y} stroke="#ee5034" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" />}
        {r && <g><circle cx={r.x} cy={r.y} r="14" fill="#fff" stroke="#ee5034" strokeWidth="2" /><text x={r.x} y={r.y + 5} textAnchor="middle" fontSize="14">🍴</text></g>}
        {c && <g><circle cx={c.x} cy={c.y} r="14" fill="#1c1a3a" /><text x={c.x} y={c.y + 5} textAnchor="middle" fontSize="14">🏠</text></g>}
        {d && !delivered && <g>
          <circle cx={d.x} cy={d.y} r="14" fill="#ee5034" opacity=".25"><animate attributeName="r" values="12;26;12" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values=".35;0;.35" dur="2s" repeatCount="indefinite" /></circle>
          <circle cx={d.x} cy={d.y} r="13" fill="#ee5034" stroke="#fff" strokeWidth="3" /><text x={d.x} y={d.y + 5} textAnchor="middle" fontSize="13">🛵</text></g>}
      </svg>
    </div>
  )
}
