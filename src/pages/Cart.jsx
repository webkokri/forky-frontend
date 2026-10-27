import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLocation2 } from '../context/LocationContext'
import { useMode } from '../context/ModeContext'
import { useAsync, money } from '../utils/useAsync'
import { AddButton, Thumb } from '../components/ui'
import AddressSearch from '../components/AddressSearch'
import StripeElement, { confirmSavedCard } from '../components/StripeElement'

const TIPS = [0, 10, 15, 20]
const LINES = [['subtotal', 'Item total'], ['deliveryFee', 'Delivery fee'], ['serviceFee', 'Service fee'], ['smallOrderFee', 'Small order fee'], ['taxAmount', 'Taxes'], ['tax', 'Taxes'], ['tip', 'Tip'], ['discountTotal', 'Discount', true], ['discount', 'Discount', true]]
const field = 'mt-1 w-full rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500'

function Addresses({ value, onChange }) {
  const { loc } = useLocation2()
  const { data, error } = useAsync(() => api.listAddresses(), [])
  const [list, setList] = useState(null)
  const [adding, setAdding] = useState(false)
  const [f, setF] = useState({ label: 'Home', line1: '', city: loc?.city || '', postalCode: '', province: 'ON' })
  const [err, setErr] = useState('')
  const shown = list || data || []

  useEffect(() => { if (!value && shown.length) onChange((shown.find((a) => a.isDefault) || shown[0]).id) }, [shown, value, onChange])

  const add = async (e) => {
    e.preventDefault(); setErr('')
    try {
      const a = await api.addAddress({ label: f.label, line1: f.line1, city: f.city, postalCode: f.postalCode, province: f.province, ...(f.lat != null ? { lat: f.lat, lng: f.lng } : loc?.lat != null ? { lat: loc.lat, lng: loc.lng } : {}), isDefault: !shown.length })
      setList([...shown, a]); onChange(a.id); setAdding(false)
    } catch (x) { setErr(x.message) }
  }

  return (
    <section className="rounded-2xl border border-ink-100 bg-white p-5">
      <h2 className="font-bold">Delivery address</h2>
      {error && <p className="mt-2 text-sm text-rose-600">{error.message}</p>}
      <div className="mt-3 space-y-2">
        {shown.map((a) => (
          <label key={a.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${value === a.id ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>
            <input type="radio" name="addr" checked={value === a.id} onChange={() => onChange(a.id)} className="mt-1 accent-brand-500" />
            <span><b>{a.label || 'Address'}</b><br /><span className="text-ink-700">{[a.line1, a.line2, a.city, a.postalCode].filter(Boolean).join(', ')}</span></span>
          </label>
        ))}
      </div>
      {adding ? (
        <>
        <div className="mt-3"><AddressSearch near={loc} onPick={(p) => setF((x) => ({ ...x, line1: p.line1, city: p.city || x.city, province: p.province || x.province, postalCode: p.postalCode || x.postalCode, lat: p.lat, lng: p.lng }))} placeholder="Search your address" /></div>
        <form onSubmit={add} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Label<input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} className={field} /></label>
          <label className="text-xs font-semibold">Street address<input required value={f.line1} onChange={(e) => setF({ ...f, line1: e.target.value })} className={field} /></label>
          <label className="text-xs font-semibold">City<input required value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} className={field} /></label>
          <label className="text-xs font-semibold">Postal code<input required value={f.postalCode} onChange={(e) => setF({ ...f, postalCode: e.target.value })} className={field} /></label>
          {err && <p className="text-sm text-rose-600 sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary">Save address</button><button type="button" onClick={() => setAdding(false)} className="btn-ghost">Cancel</button></div>
        </form>
        </>
      ) : <button onClick={() => setAdding(true)} className="mt-3 text-sm font-bold text-brand-600">+ Add new address</button>}
    </section>
  )
}

export default function Cart() {
  const cart = useCart()
  const { user, ready } = useAuth()
  const nav = useNavigate()
  const { data: payCfg } = useAsync(() => api.getPaymentsConfig(), [])
  const { data: wallet } = useAsync(() => (user ? api.getWallet() : Promise.resolve(null)), [user?.id])
  const { mode } = useMode()
  const [type, setType] = useState(mode === 'pickup' ? 'PICKUP' : 'DELIVERY')
  const [addressId, setAddressId] = useState(null)
  const [tipPct, setTipPct] = useState(0)
  const [promoInput, setPromoInput] = useState('')
  const [promo, setPromo] = useState('')
  const [pay, setPay] = useState('CARD') // card is the primary method
  const [intent, setIntent] = useState(null)
  const [saveCard, setSaveCard] = useState(false)
  // cards saved earlier: one tap to pay with one, or 'new' to type another card
  const [cards, setCards] = useState([])
  const [cardChoice, setCardChoice] = useState('new')
  const choiceTouched = useRef(false)
  const lastChoice = useRef('new')
  const card = useRef(null)
  const paid = useRef(null) // intent id already charged, if placing the order failed afterwards
  const [note, setNote] = useState('')
  const [subst, setSubst] = useState('ALLOW')
  const [quote, setQuote] = useState(null)
  const [quoteErr, setQuoteErr] = useState('')
  const [quoting, setQuoting] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [placeErr, setPlaceErr] = useState('')

  const vendor = cart.vendor
  const tip = Math.round(cart.subtotal * tipPct) / 100
  const ready2quote = user && vendor && (type === 'PICKUP' || addressId)
  const canDeliver = vendor?.deliveryAvailable !== false
  const canPickup = vendor?.pickupAvailable !== false
  // Out of the store's delivery range: fall back to pickup instead of failing the quote.
  useEffect(() => { if (vendor && !canDeliver && canPickup) setType('PICKUP') }, [vendor?.id, canDeliver, canPickup])
  const cartKey = JSON.stringify(cart.items.map((i) => [i.id, i.qty]))

  // Keep the server cart + price quote in step with what is on screen.
  useEffect(() => {
    if (!ready2quote) return undefined
    let alive = true
    setQuoting(true); setQuoteErr('')
    const t = setTimeout(async () => {
      try {
        await api.syncCart({ restaurantId: vendor.id, items: cart.items, promoCode: promo, substitution: vendor.type === 'store' ? subst : undefined })
        const q = await api.quote({ type, ...(type === 'DELIVERY' ? { addressId } : {}), ...(promo ? { promoCode: promo } : {}), ...(tip && type === 'DELIVERY' ? { tip } : {}) })
        if (alive) setQuote(q)
      } catch (e) { if (alive) { setQuote(null); setQuoteErr(e.message) } } finally { if (alive) setQuoting(false) }
    }, 400)
    return () => { alive = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready2quote, vendor?.id, cartKey, type, addressId, promo, tip, subst])

  // The customer's saved cards (default one pre-selected, unless they already picked something).
  useEffect(() => {
    if (!user) return undefined
    let alive = true
    api.listCards().then((r) => {
      if (!alive) return
      const list = r?.data || []
      setCards(list)
      if (list.length && !choiceTouched.current) setCardChoice((list.find((c) => c.isDefault) || list[0]).id)
    }).catch(() => undefined)
    return () => { alive = false }
  }, [user?.id])

  // Card payments: keep a Stripe PaymentIntent in step with the quote (the server prices it).
  const cardReady = payCfg?.provider === 'stripe' && !!payCfg?.publishableKey
  useEffect(() => {
    if (pay !== 'CARD' || !cardReady || !quote || quoteErr || !ready2quote) return undefined
    let alive = true
    const t = setTimeout(async () => {
      try {
        const r = await api.paymentIntent({ type, ...(type === 'DELIVERY' ? { addressId } : {}), ...(promo ? { promoCode: promo } : {}), ...(tip && type === 'DELIVERY' ? { tip } : {}), ...(cardChoice === 'new' && saveCard ? { saveCard: true } : {}), ...(cardChoice !== 'new' ? { paymentMethodId: cardChoice } : {}), ...(intent?.intentId && lastChoice.current === cardChoice ? { intentId: intent.intentId } : {}) })
        lastChoice.current = cardChoice
        if (alive) setIntent(r)
      } catch (e) { if (alive) { setIntent(null); setPlaceErr(e.message) } }
    }, 300)
    return () => { alive = false; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pay, cardReady, quote?.total, ready2quote, type, addressId, promo, tip, saveCard, cardChoice])

  if (!cart.count) {
    return (
      <div className="container-x py-24 text-center">
        <div className="text-7xl">🛍️</div>
        <h1 className="mt-4 font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink-500">Add something tasty or stock up on essentials.</p>
        <div className="mt-6 flex justify-center gap-3"><Link to="/restaurants" className="btn-primary">Browse restaurants</Link><Link to="/groceries" className="btn-ghost">Shop groceries</Link></div>
      </div>
    )
  }

  async function placeOrder() {
    setPlacing(true); setPlaceErr('')
    try {
      let intentId
      if (pay === 'CARD') {
        intentId = paid.current || intent?.intentId
        if (!paid.current) {
          // This is the moment the card is charged (3-D Secure is handled by Stripe).
          const r = cardChoice !== 'new'
            ? await confirmSavedCard(intent.publishableKey || payCfg.publishableKey, intent.clientSecret, cardChoice)
            : await card.current.confirm('payment')
          if (r.error) { setPlaceErr(r.error.message || 'The payment didn’t go through.'); return }
          if (!['succeeded', 'requires_capture'].includes(r.paymentIntent?.status)) { setPlaceErr('The payment isn’t complete yet. Please try again.'); return }
          paid.current = intentId
        }
      }
      const order = await api.placeOrder({ type, ...(type === 'DELIVERY' ? { addressId } : {}), paymentMethod: pay, ...(intentId ? { paymentIntentId: intentId } : {}), ...(promo ? { promoCode: promo } : {}), ...(tip && type === 'DELIVERY' ? { tip } : {}), ...(note ? { customerNotes: note } : {}) })
      paid.current = null
      cart.clear()
      nav(`/order/${order.id}`, { state: { order } })
    } catch (e) {
      if (e.code === 'PAYMENT_QUOTE_CHANGED') { paid.current = null; setIntent(null) }
      setPlaceErr(paid.current ? `Your card was charged, but we couldn’t finish the order: ${e.message}. Tap the button to try again; you won’t be charged twice.` : e.message)
    } finally { setPlacing(false) }
  }

  const total = quote?.total ?? quote?.grandTotal
  // Cash isn't accepted by the API; card needs a configured payment provider.
  const balance = wallet?.balance ?? 0
  const walletOk = payCfg?.walletEnabled && balance >= (total ?? 0)
  const methods = [['CARD', 'Credit / debit card · Apple Pay · Google Pay', cardReady], ['WALLET', `Forky wallet · ${money(balance)}`, payCfg?.walletEnabled !== false]]
  const payable = pay === 'WALLET' ? walletOk : cardReady && !!intent?.clientSecret

  return (
    <div className="container-x grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        {!ready ? null : !user ? (
          <section className="rounded-2xl border border-brand-100 bg-brand-50 p-6 text-center">
            <h2 className="font-display text-xl font-bold">Sign in to check out</h2>
            <p className="mt-1 text-sm text-ink-500">Your cart will be waiting for you.</p>
            <div className="mt-4 flex justify-center gap-3"><Link to="/login?next=/cart" className="btn-primary">Sign in</Link><Link to="/register?next=/cart" className="btn-ghost">Create account</Link></div>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="font-bold">How would you like it?</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[['DELIVERY', '🛵 Delivery', canDeliver], ['PICKUP', '🛍️ Pickup', canPickup]].map(([v, l, ok]) => (
                  <button key={v} disabled={!ok} onClick={() => setType(v)} className={`rounded-xl border p-3 text-sm font-semibold disabled:opacity-40 ${type === v ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>{l}</button>
                ))}
              </div>
            </section>
            {type === 'DELIVERY' && <Addresses value={addressId} onChange={setAddressId} />}
            <section className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="font-bold">Payment method</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {methods.map(([id, label, ok]) => (
                  <label key={id} className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${ok ? 'cursor-pointer' : 'opacity-40'} ${pay === id ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>
                    <input type="radio" name="pay" disabled={!ok} checked={pay === id} onChange={() => setPay(id)} className="accent-brand-500" /> {label}
                  </label>
                ))}
              </div>
              {pay === 'CARD' && cardReady && (
                <div className="mt-4">
                  {cards.length > 0 && (
                    <div className="mb-3 space-y-2" role="radiogroup" aria-label="Saved cards" data-testid="saved-cards">
                      {cards.map((c) => (
                        <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${cardChoice === c.id ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>
                          <input type="radio" name="savedcard" checked={cardChoice === c.id} onChange={() => { choiceTouched.current = true; setCardChoice(c.id) }} className="accent-brand-500" />
                          <span><b className="uppercase">{c.brand}</b> •••• {c.last4}<span className="text-xs text-ink-500"> · expires {String(c.expMonth).padStart(2, '0')}/{c.expYear}{c.isDefault ? ' · default' : ''}</span></span>
                        </label>
                      ))}
                      <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${cardChoice === 'new' ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>
                        <input type="radio" name="savedcard" checked={cardChoice === 'new'} onChange={() => { choiceTouched.current = true; setCardChoice('new') }} className="accent-brand-500" /> Use a different card
                      </label>
                    </div>
                  )}
                  {cardChoice === 'new' ? (
                    <>
                      {intent?.clientSecret ? <StripeElement key={intent.clientSecret} ref={card} publishableKey={intent.publishableKey || payCfg.publishableKey} clientSecret={intent.clientSecret} /> : <div className="h-28 animate-pulse rounded-xl bg-ink-100" aria-label="Loading card form" />}
                      <label className="mt-3 flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="accent-brand-500" />Save this card for next time</label>
                    </>
                  ) : (
                    <p className="text-xs text-ink-500">You’ll be charged on this card when you place the order. Saved cards can be removed in Account → Payments.</p>
                  )}
                </div>
              )}
              {!cardReady && <p className="mt-2 text-xs text-ink-500">Card payments aren’t available right now.</p>}
              {pay === 'WALLET' && total != null && !walletOk && <p className="mt-1 text-xs text-rose-600">Your wallet balance doesn’t cover this order.</p>}
            </section>
            {vendor.type === 'store' && (
              <section className="rounded-2xl border border-ink-100 bg-white p-5">
                <h2 className="font-bold">If something is out of stock</h2>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[['ALLOW', 'Replace it with a similar item'], ['REFUND', 'Remove it and refund me']].map(([v, l]) => (
                    <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-semibold ${subst === v ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>
                      <input type="radio" name="subst" checked={subst === v} onChange={() => setSubst(v)} className="accent-brand-500" /> {l}
                    </label>
                  ))}
                </div>
              </section>
            )}
            {type === 'DELIVERY' && (
              <section className="rounded-2xl border border-ink-100 bg-white p-5">
                <h2 className="font-bold">Tip your courier</h2>
                <div className="mt-3 flex flex-wrap gap-2">{TIPS.map((t) => <button key={t} onClick={() => setTipPct(t)} className={`chip ${tipPct === t ? 'chip-active' : ''}`}>{t ? `${t}% · ${money(cart.subtotal * t / 100)}` : 'No tip'}</button>)}</div>
              </section>
            )}
          </>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <Link to={`/restaurant/${vendor.slug}`} className="flex items-center gap-3">
            <Thumb emoji={vendor.emoji} bg={vendor.bg} src={vendor.image} className="h-12 w-12 rounded-xl" size="text-2xl" />
            <div><div className="font-display text-lg font-bold">{vendor.name}</div><div className="text-xs text-ink-500">{vendor.etaMins ? `${vendor.etaMins}${vendor.etaMax ? `–${vendor.etaMax}` : ''} min` : ''}</div></div>
          </Link>
          <ul className="mt-4 divide-y divide-ink-100">
            {cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{i.name}</div>
                  <div className="truncate text-xs text-ink-500">{i.optionsLabel || (i.unit ? `${i.unit} · ${money(i.price)}` : money(i.price))}</div>
                </div>
                <AddButton vendor={vendor} item={i} compact />
                <div className="w-16 text-right text-sm font-semibold">{money(i.price * i.qty)}</div>
              </li>
            ))}
          </ul>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder={vendor.type === 'store' ? 'Notes for the store' : 'Notes for the restaurant'} className="mt-2 w-full rounded-xl border border-ink-100 p-3 text-sm outline-none focus:border-brand-500" />
        </div>

        {user && (
          <div className="rounded-2xl border border-ink-100 bg-white p-5">
            <h3 className="text-sm font-bold">Promo code</h3>
            {promo ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-mint-500/10 p-3 text-sm"><span><b>{promo}</b> applied</span><button onClick={() => setPromo('')} className="font-bold text-rose-600">Remove</button></div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setPromo(promoInput.trim().toUpperCase()); setPromoInput('') }} className="mt-3 flex gap-2">
                <input value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Enter code" className="h-10 flex-1 rounded-xl border border-ink-100 px-3 text-sm uppercase outline-none focus:border-brand-500" />
                <button className="btn-ghost h-10 py-0">Apply</button>
              </form>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-ink-100 bg-white p-5 text-sm">
          <h3 className="font-bold">Bill details</h3>
          <dl className="mt-3 space-y-2">
            {quote ? LINES.filter(([k]) => quote[k] > 0).filter((l, i, a) => a.findIndex((x) => x[1] === l[1]) === i).map(([k, l, neg]) => <Row key={k} k={l} v={`${neg ? '−' : ''}${money(quote[k])}`} />)
              : <Row k="Item total" v={money(cart.subtotal)} />}
          </dl>
          {total != null && <div className="mt-3 flex justify-between border-t border-ink-100 pt-3 text-base font-extrabold"><span>To pay</span><span>{money(total)}</span></div>}
          {quoting && <p className="mt-2 text-xs text-ink-500">Updating prices…</p>}
          {quoteErr && <p className="mt-2 text-xs text-rose-600">{quoteErr}</p>}
          {placeErr && <p className="mt-2 text-xs text-rose-600">{placeErr}</p>}
          <button onClick={placeOrder} disabled={placing || !user || !quote || quoting || !payable} className="btn-primary mt-4 w-full py-3.5 text-base">{placing ? (pay === 'CARD' ? 'Processing payment…' : 'Placing order…') : total != null ? `${pay === 'CARD' ? 'Pay' : 'Place order'} · ${money(total)}` : 'Place order'}</button>
        </div>
      </aside>
    </div>
  )
}

const Row = ({ k, v }) => <div className="flex justify-between text-ink-700"><dt>{k}</dt><dd className="font-semibold text-ink-900">{v}</dd></div>
