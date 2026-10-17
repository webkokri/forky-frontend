import { useEffect } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { api } from '../api'
import { useAsync, money } from '../utils/useAsync'
import { ErrorState, Skeleton } from '../components/ui'

const STEPS = [['PLACED', 'Order placed'], ['ACCEPTED', 'Accepted'], ['PREPARING', 'Preparing'], ['READY', 'Ready'], ['PICKED_UP', 'Out for delivery'], ['DELIVERED', 'Delivered']]
const ORDER = STEPS.map(([k]) => k)
const stepIndex = (status) => { const i = ORDER.indexOf(status); return i < 0 ? (status === 'ON_THE_WAY' ? 4 : status === 'COMPLETED' ? 5 : 0) : i }

// Order confirmation + live status (polls the tracking endpoint).
export default function OrderPage() {
  const { id } = useParams()
  const { data: t, error, loading, reload } = useAsync(() => api.getTracking(id), [id])
  const { data: rv } = useAsync(() => api.getOrderReview(id).catch(() => null), [id, t?.status])
  const cart = useCart()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [rate, setRate] = useState({ restaurantRating: 0, driverRating: 0, comment: '' })
  const [rated, setRated] = useState(false)
  useEffect(() => { const i = setInterval(reload, 15000); return () => clearInterval(i) }, [reload])

  if (error) return <ErrorState error={error} />
  if (loading && !t) return <div className="container-x max-w-xl space-y-4 py-16"><Skeleton className="h-20" /><Skeleton className="h-40" /></div>
  const cancelled = /CANCEL|REJECT/.test(t.status)
  const at = stepIndex(t.status)

  return (
    <div className="container-x max-w-xl py-16">
      <div className="text-center">
        <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-4xl text-white ${cancelled ? 'bg-rose-500' : 'bg-mint-500'}`}>{cancelled ? '✕' : '✓'}</div>
        <h1 className="mt-6 font-display text-3xl font-bold">{cancelled ? 'Order cancelled' : t.status === 'DELIVERED' ? 'Enjoy your meal!' : 'Order confirmed!'}</h1>
        <p className="mt-2 text-ink-500">Order {t.code} · {t.restaurant?.name}</p>
        {t.estimatedDeliveryAt && !cancelled && t.status !== 'DELIVERED' && <p className="mt-1 text-sm font-semibold text-brand-600">Estimated {t.fulfilment === 'PICKUP' ? 'ready' : 'arrival'} {new Date(t.estimatedDeliveryAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })}</p>}
      </div>
      {!cancelled && (
        <ol className="mt-10 grid grid-cols-3 gap-x-2 gap-y-4 text-xs font-semibold sm:grid-cols-6">
          {STEPS.map(([k, l], i) => <li key={k}><div className={`mb-2 h-1.5 rounded-full ${i <= at ? 'bg-brand-500' : 'bg-ink-100'}`} />{l}</li>)}
        </ol>
      )}
      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 text-sm">
        {t.pickupCode && <div className="mb-3 flex justify-between"><span className="text-ink-500">Pickup code</span><b>{t.pickupCode}</b></div>}
        {t.driver && <div className="mb-3 flex justify-between"><span className="text-ink-500">Courier</span><b>{t.driver.name}</b></div>}
        {t.deliveryAddress && <div className="mb-3 flex justify-between gap-4"><span className="text-ink-500">Deliver to</span><b className="text-right">{t.deliveryAddress.line1}, {t.deliveryAddress.city}</b></div>}
        {t.total != null && <div className="flex justify-between border-t border-ink-100 pt-3 text-base font-extrabold"><span>Total</span><span>{money(t.total)}</span></div>}
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {t.canCancel && !cancelled && <button disabled={busy} onClick={async () => { if (!window.confirm('Cancel this order?')) return; setBusy(true); setErr(''); try { await api.cancelOrder(id, 'Cancelled by customer'); reload() } catch (e) { setErr(e.message) } finally { setBusy(false) } }} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">Cancel order</button>}
        {(t.status === 'DELIVERED' || t.status === 'COMPLETED' || cancelled) && <button disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { await api.reorder(id); await cart.restore(); nav('/cart') } catch (e) { setErr(e.message) } finally { setBusy(false) } }} className="btn-primary">Order again</button>}
      </div>
      {err && <p className="mt-3 text-center text-sm text-rose-600">{err}</p>}
      {rv?.canReview && !rated && (
        <form className="mt-8 rounded-2xl border border-ink-100 bg-white p-5 text-sm" onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await api.reviewOrder(id, { ...(rate.restaurantRating ? { restaurantRating: rate.restaurantRating } : {}), ...(rv.rateDriver && rate.driverRating ? { driverRating: rate.driverRating } : {}), ...(rate.comment ? { comment: rate.comment } : {}) }); setRated(true) } catch (x) { setErr(x.message) } }}>
          <h3 className="font-display text-lg font-bold">How was it?</h3>
          {[['restaurantRating', 'Food & service'], ...(rv.rateDriver ? [['driverRating', 'Your courier']] : [])].map(([k, l]) => (
            <div key={k} className="mt-3 flex items-center justify-between"><span>{l}</span><div>{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-label={`${n} stars`} onClick={() => setRate({ ...rate, [k]: n })} className={`text-2xl ${n <= rate[k] ? 'text-amber-400' : 'text-ink-100'}`}>★</button>)}</div></div>
          ))}
          <textarea value={rate.comment} onChange={(e) => setRate({ ...rate, comment: e.target.value })} rows={2} placeholder="Tell us more (optional)" className="mt-3 w-full rounded-xl border border-ink-100 p-3 outline-none focus:border-brand-500" />
          <button disabled={!rate.restaurantRating && !rate.driverRating} className="btn-primary mt-3 w-full">Submit review</button>
        </form>
      )}
      {rated && <p className="mt-6 text-center font-semibold text-mint-600">Thanks for your feedback!</p>}
      <div className="mt-8 flex justify-center gap-3"><Link to="/account/orders" className="btn-ghost">My orders</Link><Link to="/" className="btn-primary">Back to home</Link></div>
    </div>
  )
}
