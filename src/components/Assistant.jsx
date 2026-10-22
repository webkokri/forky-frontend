import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLocation2 } from '../context/LocationContext'
import { money } from '../utils/useAsync'
import { AddButton } from './ui'

const SESSION = 'forksy_assistant_session'
const LOG = 'forksy_assistant_log'
const HIDE_ON = ['/handoff', '/drive/onboarding', '/business/onboarding']
const CART_BAR_HIDDEN = ['/cart', '/order', '/account', '/drive', '/business', '/login', '/register']
const safe = (fn, d = null) => { try { return fn() } catch { return d } }
// "add 2 milk and a dozen eggs" -> "milk, eggs" for the product search
const FILLER = /\b(please|add|get|buy|find|search|show|me|i|we|want|need|looking|look|for|some|any|a|an|the|where|can|could|to|do|you|have|order|cart|put|in|my|dozen|couple|of|x?\d+)\b/gi
const productQuery = (s) => s.replace(FILLER, ' ').replace(/\s+and\s+/gi, ',').replace(/[^\p{L}\p{N}, ]/gu, ' ').split(',').map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => x.length > 1).join(', ')
const uid = () => Math.random().toString(36).slice(2, 10)

// Forky assistant: chat that finds restaurants/stores, builds the cart ("2 margherita and a pop") and
// hands over to checkout. Uses the central bot of the API (/public/assistant/*).
export default function Assistant() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const { user } = useAuth()
  const cart = useCart()
  const { loc } = useLocation2()
  const [cfg, setCfg] = useState(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => safe(() => JSON.parse(localStorage.getItem(LOG)), []) || [])
  const [bag, setBag] = useState({ items: [], count: 0, subtotalEstimate: 0, canCheckout: false })
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [unread, setUnread] = useState(false)
  const sessionId = useRef(safe(() => localStorage.getItem(SESSION)))
  const endRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { api.assistantConfig().then((c) => c.enabled && setCfg(c)).catch(() => {}) }, [])
  useEffect(() => { safe(() => localStorage.setItem(LOG, JSON.stringify(messages.slice(-40)))) }, [messages])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy, open])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey); setUnread(false)
    setTimeout(() => inputRef.current?.focus(), 100)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const greeting = cfg && { id: 'greet', role: 'bot', text: cfg.greeting, chips: cfg.chips }
  const shown = messages.length ? messages : greeting ? [greeting] : []

  const send = useCallback(async (label, quick, silent) => {
    const msg = (label || '').trim()
    if (!msg || busy) return
    if (!silent) setMessages((m) => [...m, { id: uid(), role: 'user', text: msg }])
    setBusy(true)
    try {
      // Not inside a restaurant yet: also search products across all stores so they can be added right away.
      const q = !quick && !bag.restaurant ? productQuery(msg) : ''
      const [r, found] = await Promise.all([
        api.assistantChat({ message: msg.slice(0, 500), ...(quick ? { quick } : {}), ...(sessionId.current ? { sessionId: sessionId.current } : {}), ...(loc?.lat != null ? { lat: loc.lat, lng: loc.lng } : {}) }),
        q ? api.search(q).catch(() => null) : null,
      ])
      sessionId.current = r.sessionId; safe(() => localStorage.setItem(SESSION, r.sessionId))
      setBag({ ...r.cart, canCheckout: r.canCheckout, restaurant: r.restaurant })
      const products = (found?.products || []).filter((p) => p.available !== false).slice(0, 6)
      if (!silent) setMessages((m) => [...m, { id: uid(), role: 'bot', ...r.reply, products, query: q }])
      if (!open) setUnread(true)
      // Keep the site cart in step with the bot's cart (signed in: the server cart was already changed).
      if (r.loggedIn) cart.restore().catch(() => {})
      else if (r.restaurant) {
        cart.setFromAssistant(r.restaurant, r.cart?.items || [])
        api.getRestaurant(r.restaurant.slug).then((v) => cart.updateVendor(r.restaurant.id, { type: v.type, emoji: v.emoji, image: v.image, minOrder: v.minOrder, deliveryAvailable: v.deliveryAvailable, pickupAvailable: v.pickupAvailable, etaMins: v.etaMins, etaMax: v.etaMax })).catch(() => {})
      }
    } catch (e) {
      const limited = e.status === 429
      setMessages((m) => [...m, { id: uid(), role: 'bot', text: limited ? 'You’re going a little fast. Give me a moment and try again.' : 'Sorry, I couldn’t reach the kitchen. Please try again.', error: true }])
    } finally { setBusy(false) }
  }, [busy, bag.restaurant, loc?.lat, loc?.lng, open, cart])

  // The site cart already holds everything (chat adds, product cards), so checkout is just the cart page.
  const checkout = () => { setOpen(false); nav('/cart') }
  const rate = (m, rating) => {
    setMessages((all) => all.map((x) => (x.id === m.id ? { ...x, rating } : x)))
    if (sessionId.current && m.messageId) api.assistantFeedback({ sessionId: sessionId.current, messageId: m.messageId, rating }).catch(() => {})
  }
  const reset = () => { setMessages([]); setBag({ items: [], count: 0, subtotalEstimate: 0, canCheckout: false, restaurant: null }); sessionId.current = null; safe(() => { localStorage.removeItem(SESSION); localStorage.removeItem(LOG) }) }

  if (!cfg || HIDE_ON.some((p) => pathname.startsWith(p))) return null
  const cartBarShown = cart.count > 0 && !CART_BAR_HIDDEN.some((p) => pathname.startsWith(p))
  const name = cfg.name?.replace(/FORKY/i, 'Forky') || 'Forky Assistant'

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label={`Open ${name}`} className={`fixed right-4 z-40 flex items-center gap-2 rounded-full bg-ink-900 py-2 pl-2 pr-4 text-white shadow-2xl shadow-ink-900/30 transition hover:-translate-y-0.5 ${cartBarShown ? (pathname.startsWith('/restaurant') || pathname.startsWith('/store') ? 'bottom-24 lg:bottom-4' : 'bottom-24') : 'bottom-4'}`}>
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white">
            {cfg.logoUrl ? <img src={cfg.logoUrl} alt="" className="h-8 w-8 object-contain" /> : <span aria-hidden>🍴</span>}
            {unread && <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white" />}
          </span>
          <span className="hidden text-sm font-bold sm:block">Need help ordering?</span>
        </button>
      )}

      {open && (
        <div role="dialog" aria-label={name} className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[640px] sm:max-h-[calc(100vh-2rem)] sm:w-[400px] sm:overflow-hidden sm:rounded-3xl sm:shadow-2xl sm:ring-1 sm:ring-ink-100">
          <header className="flex items-center gap-3 bg-gradient-to-r from-brand-500 to-flame-600 p-4 text-white">
            <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white">{cfg.logoUrl ? <img src={cfg.logoUrl} alt="" className="h-8 w-8 object-contain" /> : <span aria-hidden>🍴</span>}</span>
            <div className="min-w-0 flex-1"><div className="truncate font-bold">{name}</div><div className="truncate text-xs text-white/85">{bag.restaurant ? `Ordering from ${bag.restaurant.name}` : 'Find food and order in chat'}</div></div>
            {messages.length > 0 && <button onClick={reset} className="rounded-full px-2.5 py-1 text-xs font-semibold text-white/90 hover:bg-white/15">New chat</button>}
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="grid h-9 w-9 place-items-center rounded-full text-xl hover:bg-white/15">✕</button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-cream/50 p-4" aria-live="polite">
            {shown.map((m, idx) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                <div className={`max-w-[88%] ${m.role === 'user' ? '' : 'w-full'}`}>
                  <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-br-md bg-brand-500 text-white' : m.error ? 'rounded-bl-md bg-rose-50 text-rose-700' : 'rounded-bl-md bg-white text-ink-900 shadow-card'}`}>{m.text}</div>

                  {m.restaurants?.length > 0 && (
                    <div className="mt-2 space-y-2">{m.restaurants.map((r) => (
                      <button key={r.id} disabled={busy} onClick={() => send(`Order from ${r.name}`, `restaurant:${r.slug}`)} className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-3 text-left shadow-card transition hover:border-brand-300">
                        <div className="min-w-0"><div className="truncate text-sm font-bold">{r.name}</div><div className="truncate text-xs text-ink-500">{[r.cuisine, r.rating && `★ ${r.rating}`].filter(Boolean).join(' · ')}</div>
                          <div className="mt-1 flex gap-1.5 text-[10px] font-bold"><span className={`rounded-full px-2 py-0.5 ${r.openNow ? 'bg-teal-100 text-teal-700' : 'bg-ink-100 text-ink-500'}`}>{r.openNow ? 'Open' : 'Closed'}</span>{r.deliveryAvailable && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">Delivery</span>}{r.pickupAvailable && <span className="rounded-full bg-sun-100 px-2 py-0.5 text-sun-700">Pickup</span>}</div></div>
                        <span className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white">Order</span>
                      </button>))}</div>
                  )}

                  {m.cards?.length > 0 && (
                    <div className="mt-2 space-y-2">{m.cards.map((c) => (
                      <div key={c.menuItemId} className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
                        {c.imageUrl && <img src={c.imageUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
                        <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{c.name}</div>{c.description && <div className="line-clamp-1 text-xs text-ink-500">{c.description}</div>}
                          <div className="mt-0.5 text-sm font-extrabold">{money(c.price)}{c.tags?.length > 0 && <span className="ml-2 text-[10px] font-semibold text-teal-700">{c.tags.slice(0, 2).join(' · ')}</span>}</div></div>
                        <button disabled={busy || !c.available} onClick={() => send(`Add ${c.name}`, `add:${c.menuItemId}`)} className="shrink-0 rounded-full border border-brand-500 px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-40">{c.available ? 'Add' : 'Sold out'}</button>
                      </div>))}</div>
                  )}

                  {m.products?.length > 0 && (
                    <div className="mt-2">
                      <div className="mb-1.5 text-xs font-bold text-ink-500">Products matching “{m.query}”</div>
                      <div className="space-y-2">{m.products.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
                          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl text-2xl" style={{ background: p.bg }}>{p.image ? <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : p.emoji}</div>
                          <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{p.name}</div><div className="truncate text-xs text-ink-500">{[p.unit, p.store.name].filter(Boolean).join(' · ')}</div>
                            <div className="text-sm font-extrabold">{money(p.price)}{p.perUnit && <span className="ml-1 text-[10px] font-medium text-ink-500">{p.perUnit}</span>}</div></div>
                          <AddButton vendor={p.store} item={p} disabled={!p.store.isOpen || !p.available} compact />
                        </div>))}</div>
                    </div>
                  )}

                  {m.chips?.length > 0 && idx === shown.length - 1 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">{m.chips.map((c) => <button key={c.payload} disabled={busy} onClick={() => (c.payload === 'checkout' && cart.count ? checkout() : c.payload === 'cart' && cart.count ? document.querySelector('[role=dialog] details')?.setAttribute('open', '') : send(c.label, c.payload))} className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">{c.label}</button>)}</div>
                  )}

                  {m.role === 'bot' && m.messageId && !m.error && (
                    <div className="mt-1 flex gap-1 text-xs text-ink-300">{[['up', '👍'], ['down', '👎']].map(([r, e]) => <button key={r} onClick={() => rate(m, r)} aria-label={r === 'up' ? 'Helpful' : 'Not helpful'} className={`rounded px-1 hover:text-ink-700 ${m.rating === r ? 'text-ink-900' : ''}`}>{e}</button>)}</div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex w-16 justify-center gap-1 rounded-2xl rounded-bl-md bg-white p-3 shadow-card" aria-label="Typing">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-ink-300" style={{ animationDelay: `${i * 120}ms` }} />)}</div>}
            <div ref={endRef} />
          </div>

          {cart.count > 0 && (
            <div className="border-t border-ink-100 bg-white p-3">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="text-sm font-bold">🛒 {cart.count} item{cart.count > 1 ? 's' : ''} · {money(cart.subtotal)}<span className="ml-1 text-xs font-medium text-ink-500 group-open:hidden">(view)</span></span>
                  <button onClick={(e) => { e.preventDefault(); checkout() }} className="btn-primary !py-2 text-xs">Checkout →</button>
                </summary>
                <p className="mt-1 text-xs text-ink-500">from {cart.vendor?.name}</p>
                <ul className="mt-1 max-h-32 divide-y divide-ink-100 overflow-y-auto text-xs">{cart.items.map((i) => (
                  <li key={i.id} className="flex items-center gap-2 py-1.5"><span className="flex-1 truncate">{i.qty}× {i.name}{i.optionsLabel && <span className="text-ink-500"> ({i.optionsLabel})</span>}</span><span className="font-semibold">{money(i.price * i.qty)}</span>
                    <button onClick={() => { cart.remove(i.id); const line = bag.items.find((l) => l.menuItemId === (i.menuItemId || i.id)); if (line && bag.restaurant?.id === cart.vendor?.id) send(`Remove ${i.name}`, `remove:${line.lineId}`, true) }} aria-label={`Remove one ${i.name}`} className="text-rose-500">−</button></li>))}</ul>
              </details>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); const v = text; setText(''); send(v) }} className="flex items-center gap-2 border-t border-ink-100 bg-white p-3">
            <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="e.g. 2 margherita and a pop" aria-label="Message" className="h-11 min-w-0 flex-1 rounded-full border border-ink-100 bg-cream/60 px-4 text-sm outline-none focus:border-brand-500" />
            <button disabled={busy || !text.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-500 text-lg font-bold text-white disabled:opacity-40">➤</button>
          </form>
        </div>
      )}
    </>
  )
}
