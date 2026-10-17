// HTTP client for the Forky API (OpenAPI: docs/openapi/openapi.json). All paths
// start with /api/v1. There is one independent session per app role (customer,
// driver, restaurant) so a person can hold e.g. a customer and a driver login at
// once. An expired access token is renewed once with the refresh token.
// VITE_API_BASE_URL=/ means "same origin": the web server forwards /api/* to the API (no CORS needed).
const envBase = import.meta.env.VITE_API_BASE_URL
export const API_ORIGIN = envBase ? envBase.replace(/\/+$/, '') : (import.meta.env.DEV ? '' : 'https://api.forky.ca')

const KEYS = {
  customer: ['forksy_token', 'forksy_refresh'],
  driver: ['forksy_driver_token', 'forksy_driver_refresh'],
  restaurant: ['forksy_biz_token', 'forksy_biz_refresh'],
}
const safe = (fn) => { try { return fn() } catch { return null } }

export const tokensFor = (role = 'customer') => {
  const [a, r] = KEYS[role]
  return {
    get access() { return safe(() => localStorage.getItem(a)) },
    get refresh() { return safe(() => localStorage.getItem(r)) },
    set({ accessToken, refreshToken }) { safe(() => { localStorage.setItem(a, accessToken); if (refreshToken) localStorage.setItem(r, refreshToken) }) },
    clear() { safe(() => { localStorage.removeItem(a); localStorage.removeItem(r) }) },
  }
}
export const tokens = tokensFor('customer')

export class ApiError extends Error {
  constructor(status, body) {
    const details = Array.isArray(body?.details) && body.details.length ? `: ${body.details.join(', ')}` : ''
    super(`${body?.message || 'Request failed'}${details}`)
    this.status = status
    this.code = body?.code
    this.details = body?.details
  }
}

const qs = (params = {}) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

const refreshing = {}
async function refreshTokens(role) {
  const t = tokensFor(role)
  if (!t.refresh) return false
  refreshing[role] ??= fetch(`${API_ORIGIN}/api/v1/auth/refresh`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: t.refresh }),
  }).then(async (r) => { if (!r.ok) throw new Error('refresh failed'); t.set(await r.json()); return true })
    .catch(() => { t.clear(); window.dispatchEvent(new CustomEvent('forksy:signed-out', { detail: { role } })); return false })
    .finally(() => { refreshing[role] = null })
  return refreshing[role]
}

async function request(path, { method = 'GET', body, params, auth = true, role = 'customer', retry = true, form, token } = {}) {
  const t = tokensFor(role)
  const res = await fetch(`${API_ORIGIN}/api/v1${path}${qs(params)}`, {
    method,
    headers: { ...(form ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : auth && t.access ? { Authorization: `Bearer ${t.access}` } : {}) },
    body: form || (body === undefined ? undefined : JSON.stringify(body)),
  })
  if (res.status === 401 && auth && !token && retry && t.refresh && await refreshTokens(role)) return request(path, { method, body, params, auth, role, retry: false, form })
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null))
  return res.status === 204 ? null : res.json().catch(() => null)
}
export const http = request

export const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
export const UPLOAD_MAX = 10 * 1024 * 1024
export function validateUpload(file) {
  if (!UPLOAD_TYPES.includes(file.type)) throw new Error('Please upload a PNG, JPEG, WebP, GIF or PDF file.')
  if (file.size > UPLOAD_MAX) throw new Error('That file is larger than 10 MB.')
}
// Uploads a file and returns { url, filename, originalName, size, mimetype }.
export function upload(file, role = 'customer') {
  validateUpload(file)
  const form = new FormData()
  form.append('file', file)
  return request('/uploads', { method: 'POST', form, role })
}
