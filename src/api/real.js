import { http, tokens, tokensFor, upload } from './client'
import { toVendor, toRestaurantDetail, toMenuItem, toCuisine, emojiFor } from './adapters'
import { deepBrand } from '../utils/brand'
import { pages as localPages, footer as localFooter } from './mock/pages'

const readLoc = () => { try { return JSON.parse(localStorage.getItem('forksy_location')) || {} } catch { return {} } }
const geo = () => { const { lat, lng } = readLoc(); return lat != null && lng != null ? { lat, lng } : {} }

// Pages the website owns the wording of live in ./mock/pages.js (About, Careers, ...).
// Legal pages come from the CMS (/public/cms/:slug); friendly URLs map to CMS slugs.
const CMS_ALIAS = { 'terms-of-service': 'terms', 'privacy-policy': 'privacy', 'refund-policy': 'refund-policy' }
const LEGAL = new Set(Object.keys(CMS_ALIAS))

export const real = {
  // ---------- discovery ----------
  // vertical: 'FOOD' (restaurants) or 'RETAIL' (grocery & shops); omit for everything.
  home: async (vertical) => {
    const d = await http('/public/home', { params: { ...geo(), vertical }, auth: false })
    return {
      ...d,
      banners: deepBrand(d.banners),
      nearby: d.nearby.map(toVendor), popular: d.popular.map(toVendor), fastest: d.fastest.map(toVendor), new: d.new.map(toVendor),
      cuisines: d.cuisines.map(toCuisine),
    }
  },
  // Browse vendors: { vertical: 'FOOD'|'RETAIL', storeType, cuisine (slug), q }
  listVendors: async ({ vertical, storeType, cuisine, q, fulfilment } = {}) => {
    const res = await http('/public/stores', { params: { vertical, storeType, cuisine, q, fulfilment, ...geo(), limit: 50 }, auth: false })
    return res.data.map(toVendor)
  },
  // One page of vendors for infinite scroll: { items, meta: { page, limit, total, totalPages } }
  listVendorsPage: async ({ vertical, storeType, cuisine, q, openNow, sort, fulfilment } = {}, page = 1, limit = 12) => {
    const res = await http('/public/stores', { params: { vertical, storeType, cuisine, q, sort, fulfilment, ...(openNow ? { openNow: true } : {}), ...geo(), page, limit }, auth: false })
    return { items: res.data.map(toVendor), meta: res.meta }
  },
  listRestaurants: (opts = {}) => real.listVendors({ ...opts, vertical: 'FOOD' }),
  listStores: (opts = {}) => real.listVendors({ ...opts, vertical: 'RETAIL' }),
  listStoreTypes: async (vertical) => (await http('/public/store-types', { params: { ...geo() }, auth: false })).data.filter((t) => !vertical || t.vertical === vertical),
  getRestaurant: async (slug) => {
    const [detail, reviews] = await Promise.all([
      http(`/public/restaurants/${slug}`, { params: { ...geo(), perCategory: 100 }, auth: false }),
      http(`/public/restaurants/${slug}/reviews`, { params: { limit: 20 }, auth: false }).catch(() => null),
    ])
    return toRestaurantDetail(detail, reviews)
  },
  // Cuisine chips for restaurants only (the cuisine list also holds grocery departments).
  listFoodCategories: async () => (await real.home('FOOD')).cuisines.filter((c) => c.count > 0),
  // Offers shown on the home page: platform deals + restaurant promotions.
  listCoupons: async () => {
    const [deals, home] = await Promise.all([http('/public/deals', { auth: false }).catch(() => []), real.home().catch(() => null)])
    const fromDeals = deals.map((d) => ({ code: d.code, description: d.description || d.name, minOrder: d.minSubtotal }))
    const fromPromos = (home?.promotions || []).map((p) => ({ code: p.code, description: p.description || p.name, minOrder: p.minSubtotal }))
    const seen = new Set()
    return [...fromDeals, ...fromPromos].filter((c) => c.code && !seen.has(c.code) && seen.add(c.code))
  },
  listBanners: async (placement = 'HOME') => deepBrand(await http('/public/banners', { params: { placement }, auth: false })),
  listCities: () => http('/public/cities', { auth: false }),
  resolveZone: (lat, lng) => http('/public/zones/resolve', { params: { lat, lng }, auth: false }),
  getConfig: () => http('/public/config', { params: { app: 'customer', platform: 'web' }, auth: false }),

  // A place matches if it has any of the comma-separated items; most matches first, then nearest.
  search: async (q) => {
    const terms = q.split(',').map((t) => t.trim()).filter(Boolean)
    const results = await Promise.all(terms.map((t) => http('/public/search', { params: { q: t, ...geo(), limit: 30 }, auth: false })))
    const byId = new Map()
    results.forEach((res, i) => res.restaurants.forEach((r) => {
      const e = byId.get(r.id) || { v: toVendor(r), matched: [] }
      e.matched.push(terms[i]); byId.set(r.id, e)
    }))
    const restaurants = [...byId.values()]
      .sort((a, b) => b.matched.length - a.matched.length || a.v.distanceKm - b.v.distanceKm)
      .map(({ v, matched }) => ({ ...v, matched }))
    const seen = new Set()
    const products = results.flatMap((res) => res.dishes || []).filter((d) => !seen.has(d.id) && seen.add(d.id))
      .map((d) => ({ ...toMenuItem(d, d.restaurant?.retail ? 'product' : ''), store: toVendor({ ...d.restaurant, cuisines: [], rating: null }) }))
    return { restaurants, products }
  },

  // ---------- Forky assistant (central bot) ----------
  assistantConfig: async () => deepBrand(await http('/public/assistant/config', { auth: false })),
  // Signed-in customers send their token so cart changes are mirrored into their real cart.
  assistantChat: async (body) => deepBrand(await http('/public/assistant/chat', { method: 'POST', body })),
  assistantFeedback: (body) => http('/public/assistant/feedback', { method: 'POST', body }),
  assistantHandoff: (sessionId) => http('/public/assistant/handoff', { method: 'POST', body: { sessionId } }),
  importHandoff: (token) => http('/customer/assistant/import-handoff', { method: 'POST', body: { token } }),

  // ---------- website settings (logo, SEO, footer, scripts) ----------
  getSite: async () => deepBrand(await http('/public/site', { auth: false })),
  getSiteFaq: (lang = 'en') => http('/public/site/faq', { params: { lang }, auth: false }),
  getHead: async (path, lang) => deepBrand(await http('/public/site/head', { params: { path, lang }, auth: false })),

  // ---------- content ----------
  getPage: async (slug) => deepBrand(await real.getPageRaw(slug)),
  getPageRaw: async (slug) => {
    const local = localPages.find((p) => p.slug === slug)
    const cmsSlug = CMS_ALIAS[slug] || slug
    if (slug === 'faq') {
      // Own entries + the customer FAQ, managed in the admin console (site FAQ); older /public/faqs as a fallback.
      let faqs = (await http('/public/site/faq', { params: { lang: 'en' }, auth: false }).catch(() => null))?.items
      if (!faqs?.length) faqs = (await http('/public/faqs', { params: { audience: 'CUSTOMER' }, auth: false }).catch(() => [])).map((f) => ({ question: f.question, answer: f.answer, category: f.category }))
      if (faqs.length) {
        const groups = [...new Set(faqs.map((f) => f.category || 'General'))]
        return { ...local, sections: [...groups.map((g) => ({ type: 'faq', heading: g, items: faqs.filter((f) => (f.category || 'General') === g).map((f) => ({ q: f.question, a: f.answer })) })), ...local.sections.filter((s) => s.type === 'cta')] }
      }
    }
    if (LEGAL.has(slug) || !local) {
      try {
        const c = await http(`/public/cms/${cmsSlug}`, { auth: false })
        const paras = c.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
        return { slug, title: c.title, layout: local?.layout || 'article', updatedAt: c.updatedAt, description: c.body.slice(0, 160), sections: [{ type: 'text', body: paras }] }
      } catch (e) {
        if (!local) throw e
      }
    }
    if (local) return local
    throw Object.assign(new Error('Page not found'), { status: 404 })
  },
  getFooter: async () => localFooter,
  sendContact: async (msg) => {
    if (!tokens.access) throw Object.assign(new Error('Sign in to send a ticket'), { code: 'NO_AUTH' })
    const category = { order: 'OTHER', account: 'ACCOUNT', other: 'OTHER' }[msg.topic] || 'OTHER'
    return http('/customer/support/tickets', { method: 'POST', body: { subject: `[${msg.topic}] ${msg.message.slice(0, 60)}`, body: msg.message, category } })
  },

  // ---------- auth (role: customer | driver | restaurant) ----------
  login: (identifier, password, role = 'customer') => http('/auth/login', { method: 'POST', auth: false, body: { identifier, password, app: role, deviceInfo: navigator.userAgent.slice(0, 120) } }),
  // First sign-in of an account that must use 2FA: the temp token authorises setup + enable.
  setup2fa: (tempToken) => http('/auth/2fa/setup', { method: 'POST', token: tempToken, body: {} }),
  enable2fa: (tempToken, code) => http('/auth/2fa/enable', { method: 'POST', token: tempToken, body: { code } }),
  verify2fa: (tempToken, code) => http('/auth/2fa/verify', { method: 'POST', auth: false, body: { tempToken, code } }),
  register: (body) => http('/auth/customer/register', { method: 'POST', auth: false, body }),
  me: (role = 'customer') => http('/auth/me', { role }),
  logout: (role = 'customer') => http('/auth/logout', { method: 'POST', role, body: { refreshToken: tokensFor(role).refresh } }).catch(() => null),
  forgotPassword: (identifier) => http('/auth/forgot-password', { method: 'POST', auth: false, body: { identifier } }),
  resetPassword: (body) => http('/auth/reset-password', { method: 'POST', auth: false, body }),
  changePassword: (body, role = 'customer') => http('/auth/change-password', { method: 'POST', body, role }),
  upload,

  // ---------- customer account ----------
  getProfile: () => http('/customer/profile'),
  updateProfile: (body) => http('/customer/profile', { method: 'PATCH', body }),
  updateNotifications: (body) => http('/customer/profile/notifications', { method: 'PATCH', body }),
  updateConsents: (body) => http('/customer/profile/consents', { method: 'PATCH', body }),
  updateDietary: (body) => http('/customer/profile/dietary', { method: 'PATCH', body }),
  requestPrivacy: (type, notes) => http('/customer/privacy/requests', { method: 'POST', body: { type, notes } }),
  requestDeletion: (reason) => http('/customer/privacy/deletion', { method: 'POST', body: { reason } }),
  cancelDeletion: () => http('/customer/privacy/deletion/cancel', { method: 'POST', body: {} }),

  listAddresses: () => http('/customer/addresses'),
  addAddress: (a) => http('/customer/addresses', { method: 'POST', body: a }),
  updateAddress: (id, a) => http(`/customer/addresses/${id}`, { method: 'PATCH', body: a }),
  deleteAddress: (id) => http(`/customer/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id) => http(`/customer/addresses/${id}/default`, { method: 'POST', body: {} }),

  getCart: () => http('/customer/cart'),
  clearServerCart: () => http('/customer/cart', { method: 'DELETE' }),
  // Our cart lives in the browser until checkout; it is mirrored to the server cart.
  syncCart: ({ restaurantId, items, promoCode, substitution }) => http('/customer/cart/replace', {
    method: 'POST',
    body: { restaurantId, ...(promoCode ? { promoCode } : {}), items: items.map((i) => ({ menuItemId: i.menuItemId || i.id, quantity: i.qty, modifierOptionIds: i.modifierOptionIds || [], ...(i.notes ? { notes: i.notes } : {}), ...(substitution ? { substitution } : {}) })) },
  }),
  getWallet: (params) => http('/customer/wallet', { params: { limit: 20, ...params } }),
  redeemGiftCard: (code) => http('/customer/wallet/redeem-gift-card', { method: 'POST', body: { code } }),
  topUpIntent: (amount) => http('/customer/wallet/top-up-intent', { method: 'POST', body: { amount } }),
  listCards: () => http('/customer/cards'),
  deleteCard: (id) => http(`/customer/cards/${id}`, { method: 'DELETE' }),
  setDefaultCard: (id) => http(`/customer/cards/${id}/default`, { method: 'POST', body: {} }),
  cardSetupIntent: () => http('/customer/cards/setup-intent', { method: 'POST', body: {} }),
  getPaymentsConfig: () => http('/public/payments/config', { auth: false }),
  listFavorites: async () => (await http('/customer/favorites', { params: geo() })).data.map(toVendor),
  addFavorite: (id) => http(`/customer/favorites/${id}`, { method: 'POST', body: {} }),
  removeFavorite: (id) => http(`/customer/favorites/${id}`, { method: 'DELETE' }),
  getReferrals: () => http('/customer/referrals'),

  listNotifications: (params) => http('/notifications', { params }),
  unreadCount: () => http('/notifications/unread-count'),
  markNotificationRead: (id) => http(`/notifications/${id}/read`, { method: 'POST', body: {} }),
  markAllNotificationsRead: () => http('/notifications/read-all', { method: 'POST', body: {} }),

  issueTypes: () => http('/customer/support/issue-types'),
  listTickets: () => http('/customer/support/tickets'),
  createTicket: (body) => http('/customer/support/tickets', { method: 'POST', body }),
  getTicket: (id) => http(`/customer/support/tickets/${id}`),
  ticketMessages: (id) => http(`/customer/support/tickets/${id}/messages`),
  sendTicketMessage: (id, body) => http(`/customer/support/tickets/${id}/messages`, { method: 'POST', body: { body } }),

  // ---------- checkout & orders ----------
  quote: (body) => http('/customer/checkout/quote', { method: 'POST', body }),
  placeOrder: (body) => http('/customer/orders', { method: 'POST', body }),
  listOrders: (params) => http('/customer/orders', { params: { limit: 50, ...params } }),
  getOrder: (id) => http(`/customer/orders/${id}`),
  getTracking: (id) => http(`/orders/${id}/tracking`),
  cancelOrder: (id, reason) => http(`/customer/orders/${id}/cancel`, { method: 'POST', body: { reason } }),
  reorder: (id) => http(`/customer/orders/${id}/reorder`, { method: 'POST', body: {} }),
  getOrderReview: (id) => http(`/customer/orders/${id}/review`),
  reviewOrder: (id, body) => http(`/customer/orders/${id}/review`, { method: 'POST', body }),
  pendingRatings: () => http('/customer/ratings/pending'),

  listFaqs: (audience) => http('/public/faqs', { params: { audience }, auth: false }),

  // ---------- driver onboarding ----------
  requestDriverOtp: (phone) => http('/auth/driver/otp', { method: 'POST', auth: false, body: { phone, app: 'driver' } }),
  registerDriver: (body) => http('/auth/driver/register', { method: 'POST', auth: false, body }),
  driverProfile: () => http('/driver/profile', { role: 'driver' }),
  driverChecklist: () => http('/driver/checklist', { role: 'driver' }),
  driverDocuments: () => http('/driver/documents', { role: 'driver' }),
  addDriverDocument: (body) => http('/driver/documents', { method: 'POST', body, role: 'driver' }),
  replaceDriverDocument: (id, body) => http(`/driver/documents/${id}`, { method: 'PATCH', body, role: 'driver' }),
  driverTraining: () => http('/driver/training', { role: 'driver' }),
  submitQuiz: (moduleId, answers) => http(`/driver/training/${moduleId}/quiz`, { method: 'POST', body: { answers }, role: 'driver' }),
  saveDriverBank: (body) => http('/driver/bank', { method: 'PUT', body, role: 'driver' }),

  listAllCuisines: () => http('/public/cuisines', { auth: false }),

  // ---------- business onboarding ----------
  applyBusiness: (body) => http('/auth/restaurant/apply', { method: 'POST', auth: false, body }),
  businessDashboard: () => http('/restaurant/dashboard', { role: 'restaurant' }),
  businessBank: () => http('/restaurant/finance/bank', { role: 'restaurant' }),
  businessChecklist: () => http('/restaurant/store/documents/checklist', { role: 'restaurant' }),
  businessDocuments: () => http('/restaurant/store/documents', { role: 'restaurant' }),
  addBusinessDocument: (body) => http('/restaurant/store/documents', { method: 'POST', body, role: 'restaurant' }),
  businessHours: () => http('/restaurant/store/hours', { role: 'restaurant' }),
  saveBusinessHours: (hours) => http('/restaurant/store/hours', { method: 'PATCH', body: { hours }, role: 'restaurant' }),
  saveBusinessBank: (body) => http('/restaurant/finance/bank', { method: 'POST', body, role: 'restaurant' }),
}

export { emojiFor, tokens }
