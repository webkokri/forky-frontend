// Converts Forky API payloads into the shapes the UI components already use.
const EMOJI = { pizza: '🍕', burgers: '🍔', sushi: '🍣', chinese: '🥡', indian: '🍛', thai: '🍜', italian: '🍝', mexican: '🌮', desserts: '🍰', 'coffee-tea': '🫖', breakfast: '🥞', healthy: '🥗', vegan: '🥬', seafood: '🦐', bbq: '🍖', chicken: '🍗', wings: '🍗', sandwiches: '🥪', bakery: '🥐', japanese: '🍱', korean: '🍲', greek: '🥙', vietnamese: '🍜', caribbean: '🍹' }

const STORE_EMOJI = { GROCERY: '🛒', CONVENIENCE: '🏪', SPECIALTY: '🥩' }
const PRODUCT_EMOJI = [[/produce|fruit|veg/i, '🥬'], [/frozen|chilled|dairy/i, '🧊'], [/drink|beverage/i, '🧃'], [/rice|noodle|pantry|grain/i, '🍚'], [/meat|butcher|halal/i, '🥩'], [/bakery|bread/i, '🍞']]
export const productEmoji = (cat = '') => (PRODUCT_EMOJI.find(([re]) => re.test(cat)) || [0, '🛒'])[1]
export const emojiFor = (name = '') => EMOJI[name.toLowerCase().replace(/&/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')] || '🍽️'
const PEACH = ['#ffe9b8', '#d4f5ee', '#ffdbe3', '#d6ecff', '#ffdcc7', '#e6dcff']
export const bgFor = (id = '') => PEACH[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % PEACH.length]
export const absUrl = (u) => u || null

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const time12 = (t = '') => { const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}` }
const money2 = (n) => `$${Number(n).toFixed(2)}`
const promoText = (p) => (!p ? null : typeof p === 'string' ? p : p.label || p.name || p.description || null)

export function toVendor(r) {
  if (!r) return r
  return {
    type: r.retail ? 'store' : 'restaurant',
    storeType: r.storeType, storeTypeLabel: r.storeTypeLabel, vertical: r.vertical,
    id: r.id, slug: r.slug, name: r.name,
    emoji: r.retail ? STORE_EMOJI[r.storeType] || '🛒' : emojiFor(r.cuisines?.[0]), bg: bgFor(r.id),
    tags: r.cuisines || [],
    image: r.coverUrl || r.logoUrl || null, logo: r.logoUrl || null,
    cuisines: r.cuisines || [],
    rating: r.rating, ratingCount: r.ratingCount, ratingLabel: r.ratingLabel,
    etaMins: r.etaRange?.min ?? r.etaMinutes, etaMax: r.etaRange?.max,
    distanceKm: r.distanceKm, deliveryFee: r.deliveryFee, minOrder: r.minimumOrder, priceLevel: r.priceLevel,
    isOpen: r.isOpen ?? r.status?.open ?? true,
    deliveryAvailable: r.deliveryAvailable, pickupAvailable: r.pickupAvailable, serviceModeLabel: r.serviceModeLabel,
    inDeliveryRange: r.inDeliveryRange, isNew: r.isNew, isFavorite: r.isFavorite, isFeatured: r.isFeatured,
    offer: promoText(r.promo),
    opensAt: r.status?.opensAt || null,
    area: r.area || '',
  }
}

const vegTag = (tags = []) => tags.some((t) => ['vegetarian', 'vegan'].includes(String(t).toLowerCase()))

// Products sold by weight are added in steps (e.g. 0.5 kg); price/quantity are per step.
export function toMenuItem(i, category) {
  const byWeight = i.sellBy === 'WEIGHT' && i.stepPrice != null
  return {
    id: i.id, name: i.name, description: i.description || '', price: byWeight ? i.stepPrice : i.price, pickupPrice: i.pickupPrice,
    byWeight, unit: byWeight ? i.stepLabel : i.packSize, perUnit: byWeight ? `${money2(i.price)} / ${(i.weightUnit || 'kg').toLowerCase()}` : null,
    brand: i.brand, inStock: i.inStock !== false, lowStock: i.lowStock, maxQuantity: i.maxQuantity, ageRestricted: i.ageRestricted, minAge: i.minAge, temperature: i.temperature,
    image: i.imageUrl || null, veg: vegTag(i.dietaryTags), bestseller: i.isPopular, available: i.available !== false && i.inStock !== false,
    unavailableReason: i.unavailableReason, modifierGroups: i.modifierGroups || [], allergens: i.allergens || [], calories: i.calories,
    emoji: category ? productEmoji(category) : '🍽️', bg: '#fef2ee',
  }
}

export function toRestaurantDetail(d, reviewsRes) {
  const r = d.restaurant
  const a = r.address || {}
  const closes = r.status?.closesAt && new Date(r.status.closesAt)
  const hours = r.status?.open
    ? (closes ? `Open · closes at ${closes.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: r.timezone })}` : 'Open now')
    : (r.nextOpening ? `Closed · opens ${new Date(r.nextOpening).toLocaleString('en-CA', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: r.timezone })}` : 'Closed right now')
  return {
    ...toVendor(r),
    ratingCount: d.ratings?.ratingCount ?? r.ratingCount,
    description: r.description || '',
    address: [a.line1, a.line2, a.city, a.province, a.postalCode].filter(Boolean).join(', '),
    area: a.city || '', phone: r.phone, website: r.website, hours,
    weekly: Array.isArray(r.hours) ? r.hours.map((h) => [DAYS[h.dayOfWeek], h.closed ? 'Closed' : `${time12(h.openTime)} – ${time12(h.closeTime)}`]) : [],
    pickupInstructions: r.pickupInstructions,
    menu: d.menu.categories.map((c) => ({ id: c.id, name: c.name, items: c.items.map((i) => toMenuItem(i, r.retail ? c.name : '')) })),
    popular: (d.menu.popular || []).map((i) => toMenuItem(i)),
    itemLabel: r.store?.itemLabelPlural || (r.retail ? 'products' : 'dishes'), categoryLabel: r.store?.categoryLabel || 'Menu section',
    maxQty: r.store?.limits?.maxQtyPerLine,
    promos: d.promos || [],
    ratingSummary: reviewsRes?.summary || d.ratings || null,
    reviews: (reviewsRes?.data || d.reviews || []).map(toReview),
    gallery: (r.photos || []).map((p, i) => ({ id: `p${i}`, url: typeof p === 'string' ? p : p.url, caption: r.name })),
  }
}

export function toReview(r, i = 0) {
  return {
    id: r.id || `rv${i}`,
    author: r.author || r.customerName || r.customer?.firstName || r.firstName || 'Customer',
    rating: r.rating ?? r.stars ?? 0,
    text: r.comment || r.text || r.body || '',
    date: r.createdAt || r.date || new Date().toISOString(),
    helpful: r.helpful ?? 0,
  }
}

export const toCuisine = (c) => ({ id: c.slug, name: c.name, emoji: emojiFor(c.slug), iconUrl: c.iconUrl, count: c.restaurantCount })
