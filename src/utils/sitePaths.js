// The API's SEO/footer data uses the paths of its own storefront (/order, /order/r/:slug).
// These helpers translate between those and this website's routes.
export function toLocalPath(url = '') {
  if (!url.startsWith('/')) return url
  if (url === '/order' || url.startsWith('/order?')) return url.replace('/order', '') || '/'
  const store = url.match(/^\/order\/r\/([^/?#]+)/)
  if (store) return `/restaurant/${store[1]}`
  return url.replace(/^\/order\//, '/')
}

export function toApiPath(pathname, search = '') {
  if (pathname === '/') return '/order'
  if (pathname === '/groceries') return '/order?t=GROCERY'
  if (pathname === '/restaurants') return '/order?t=RESTAURANT'
  const m = pathname.match(/^\/(?:restaurant|store)\/([^/]+)/)
  if (m) return `/order/r/${m[1]}`
  return `/order${pathname}${search ? '' : ''}`
}

// Pages that must never be indexed, whatever the API says.
const PRIVATE = ['/handoff', '/account', '/cart', '/login', '/register', '/forgot-password', '/reset-password', '/order/', '/orders', '/drive/onboarding', '/drive/login', '/business/onboarding', '/business/login']
export const isPrivatePath = (p) => PRIVATE.some((x) => p === x || p.startsWith(x.endsWith('/') ? x : `${x}/`) || p === x.replace(/\/$/, ''))
