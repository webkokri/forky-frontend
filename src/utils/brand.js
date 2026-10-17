// The platform is called Forky. Text that comes from the API (banners, legal pages, FAQ, assistant)
// may still say "Forksy"; swap it for display. Emails, URLs and hostnames are left alone.
const RE = /(?<![@/.\w-])forksy(?![@/\w-]|\.\w)/gi
const swap = (m) => (m === m.toUpperCase() ? 'FORKY' : m[0] === m[0].toUpperCase() ? 'Forky' : 'forky')
export const brandText = (s) => (typeof s === 'string' ? s.replace(RE, swap) : s)
export function deepBrand(v) {
  if (typeof v === 'string') return brandText(v)
  if (Array.isArray(v)) return v.map(deepBrand)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepBrand(x)]))
  return v
}
