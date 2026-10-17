import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { api } from '../api'
import { useAuth } from './AuthContext'

// One cart per vendor at a time, like most delivery apps. Adding an item from a
// different restaurant/store asks before replacing the cart.
const CartContext = createContext(null)
const STORAGE_KEY = 'forksy_cart'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { vendor: null, items: {} } } catch { return { vendor: null, items: {} } }
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { vendor, item } = action
      const base = state.vendor?.id === vendor.id ? state : { vendor, items: {} }
      const cur = base.items[item.id]
      return { vendor, items: { ...base.items, [item.id]: { ...item, qty: (cur?.qty || 0) + 1 } } }
    }
    case 'remove': {
      const cur = state.items[action.id]
      if (!cur) return state
      const items = { ...state.items }
      if (cur.qty <= 1) delete items[action.id]
      else items[action.id] = { ...cur, qty: cur.qty - 1 }
      return Object.keys(items).length ? { ...state, items } : { vendor: null, items: {} }
    }
    case 'clear':
      return { vendor: null, items: {} }
    case 'hydrate':
      return { vendor: action.vendor, items: action.items }
    case 'vendor':
      return state.vendor?.id === action.id ? { ...state, vendor: { ...state.vendor, ...action.patch } } : state
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [pending, setPending] = useState(null) // add waiting on "replace cart?" confirm
  const { user } = useAuth()
  const synced = useRef(false)

  // Turns a server cart ({ restaurant, lines }) into the local cart shape.
  const applyServerCart = (c) => {
    if (!c?.restaurant || !c.lines?.length) return false
    const r = c.restaurant
    const vendor = { id: r.id, slug: r.slug, name: r.name, type: r.retail ? 'store' : 'restaurant', emoji: r.retail ? '🛒' : '🍽️', bg: '#fef2ee', minOrder: r.minimumOrder, deliveryAvailable: r.deliveryAvailable, pickupAvailable: r.pickupAvailable, image: r.logoUrl }
    const items = {}
    c.lines.filter((l) => l.valid !== false).forEach((l) => {
      const ids = (l.modifiers || []).map((m) => m.optionId ?? m.id).filter(Boolean)
      const id = ids.length || l.notes ? `${l.menuItemId}:${[...ids].sort().join(',')}:${l.notes || ''}` : l.menuItemId
      items[id] = { id, menuItemId: l.menuItemId, name: l.name, price: l.unitPrice, qty: l.quantity, modifierOptionIds: ids, notes: l.notes || undefined, unit: l.weightLabel || l.packSize, image: l.imageUrl, optionsLabel: (l.modifiers || []).map((m) => m.name).filter(Boolean).join(', '), maxQuantity: l.maxQuantity }
    })
    if (!Object.keys(items).length) return false
    dispatch({ type: 'hydrate', vendor, items })
    return true
  }
  // Signed in: restore a cart saved on the server (e.g. from another device) if this browser has none.
  useEffect(() => {
    synced.current = false
    if (!user) return undefined
    let alive = true
    const done = () => { if (alive) synced.current = true }
    if (state.vendor) { done(); return () => { alive = false } }
    api.getCart().then((c) => { if (alive) applyServerCart(c) }).catch(() => {}).finally(done)
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Mirror the cart to the server so it follows the customer across devices.
  useEffect(() => {
    if (!user || !synced.current) return undefined
    const t = setTimeout(() => {
      const items = Object.values(state.items)
      if (state.vendor && items.length) api.syncCart({ restaurantId: state.vendor.id, items }).catch(() => {})
      else api.clearServerCart().catch(() => {})
    }, 1200)
    return () => clearTimeout(t)
  }, [state, user])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  const value = useMemo(() => {
    const items = Object.values(state.items)
    const count = items.reduce((s, i) => s + i.qty, 0)
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0)
    return {
      vendor: state.vendor,
      items,
      count,
      subtotal,
      qtyOf: (id) => state.items[id]?.qty || Object.values(state.items).filter((i) => i.menuItemId === id).reduce((s, i) => s + i.qty, 0),
      add: (vendor, item) => {
        const v = { id: vendor.id, slug: vendor.slug, name: vendor.name, type: vendor.type || 'restaurant', etaMins: vendor.etaMins, etaMax: vendor.etaMax, area: vendor.area, emoji: vendor.emoji, bg: vendor.bg, image: vendor.image, minOrder: vendor.minOrder, pickupAvailable: vendor.pickupAvailable, deliveryAvailable: vendor.deliveryAvailable }
        if (state.vendor && state.vendor.id !== v.id) setPending({ vendor: v, item })
        else dispatch({ type: 'add', vendor: v, item })
      },
      remove: (id) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
      restore: () => api.getCart().then(applyServerCart),
      // Mirror the assistant's cart (guests have no server cart): replace ours with the bot's lines.
      setFromAssistant: (r, lines) => {
        if (!r) return
        if (!lines.length) { if (state.vendor?.id === r.id) dispatch({ type: 'clear' }); return }
        const vendor = state.vendor?.id === r.id ? state.vendor : { id: r.id, slug: r.slug, name: r.name, type: 'restaurant', emoji: '🍽️', bg: '#fef2ee', image: r.logoUrl }
        const items = {}
        lines.forEach((l) => {
          const ids = (l.options || []).map((o) => o.id)
          const id = ids.length || l.notes ? `${l.menuItemId}:${[...ids].sort().join(',')}:${l.notes || ''}` : l.menuItemId
          items[id] = { id, menuItemId: l.menuItemId, name: l.name, price: l.quantity ? l.lineTotal / l.quantity : l.unitPrice, qty: l.quantity, modifierOptionIds: ids, notes: l.notes || undefined, optionsLabel: (l.options || []).map((o) => o.name).join(', ') }
        })
        dispatch({ type: 'hydrate', vendor, items })
      },
      updateVendor: (id, patch) => dispatch({ type: 'vendor', id, patch }),
      pending,
      confirmReplace: () => { dispatch({ type: 'add', ...pending }); setPending(null) },
      cancelReplace: () => setPending(null),
    }
  }, [state, pending])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
