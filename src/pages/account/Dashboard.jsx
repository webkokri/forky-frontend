import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useAsync, money } from '../../utils/useAsync'
import { isActiveOrder, statusLabel, statusTone, when } from '../../utils/orders'
import { Card, Empty, PageHead } from '../../components/AccountLayout'
import { Skeleton } from '../../components/ui'

const Stat = ({ icon, label, value, to, tint }) => (
  <Link to={to} className="min-w-0 rounded-2xl border border-ink-100 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200 sm:p-5">
    <div className={`grid h-9 w-9 place-items-center rounded-xl text-xl sm:h-11 sm:w-11 sm:text-2xl ${tint}`}>{icon}</div>
    <div className="mt-2 truncate font-display text-xl font-bold sm:text-3xl">{value}</div>
    <div className="text-xs text-ink-500 sm:text-sm">{label}</div>
  </Link>
)

export default function Dashboard() {
  const { user } = useAuth()
  const cart = useCart()
  const { data: profile } = useAsync(() => api.getProfile(), [])
  const { data: orders, loading } = useAsync(() => api.listOrders({ limit: 20 }), [])
  const { data: ratings } = useAsync(() => api.pendingRatings().catch(() => null), [])
  const { data: ref } = useAsync(() => api.getReferrals().catch(() => null), [])
  const [copied, setCopied] = useState(false)
  const list = orders?.data || []
  const active = list.filter(isActiveOrder)
  const recent = list.filter((o) => !isActiveOrder(o)).slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHead title={`Hi ${user.firstName} 👋`} subtitle="Here’s what’s happening with your Forky account." />
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat tint="bg-sun-100" icon="📦" label="Total orders" value={profile?.totalOrders ?? '–'} to="/account/orders" />
        <Stat tint="bg-teal-100" icon="💳" label="Wallet balance" value={profile ? money(profile.walletBalance) : '–'} to="/account/payments" />
        <Stat tint="bg-pink-100" icon="📍" label="Saved addresses" value={profile?.addressCount ?? '–'} to="/account/addresses" />
      </div>

      {cart.count > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-4 !border-brand-200 !bg-brand-50">
          <div><div className="text-xs font-bold uppercase tracking-wider text-brand-600">Items waiting in your cart</div><div className="mt-1 font-display text-xl font-bold">{cart.count} item{cart.count > 1 ? 's' : ''} from {cart.vendor?.name}</div><div className="text-sm text-ink-500">Subtotal {money(cart.subtotal)}</div></div>
          <div className="flex gap-2"><Link to="/cart" className="btn-primary">Checkout</Link><Link to={`/${cart.vendor?.type === 'store' ? 'store' : 'restaurant'}/${cart.vendor?.slug}`} className="btn-ghost">Keep shopping</Link></div>
        </Card>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Active orders</h2>
        {loading ? <Skeleton className="h-24" /> : active.length ? (
          <div className="space-y-3">{active.map((o) => (
            <Link key={o.id} to={`/order/${o.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-white p-5 shadow-card transition hover:border-brand-500">
              <div><div className="font-bold">{o.restaurantName || 'Order'} · {o.code}</div><div className="text-sm text-ink-500">Placed {when(o.createdAt)}</div></div>
              <div className="text-right"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusTone(o.status)}`}>{statusLabel(o)}</span><div className="mt-1 text-sm font-semibold text-brand-600">Track →</div></div>
            </Link>
          ))}</div>
        ) : <Empty icon="🛵" title="No active orders" text="When you place an order you can follow it here." action={<Link to="/restaurants" className="btn-primary">Order something</Link>} />}
      </section>

      {ratings?.data?.length > 0 && (
        <Card><h3 className="font-bold">How was your last order?</h3>
          <ul className="mt-3 space-y-2">{ratings.data.slice(0, 2).map((r) => <li key={r.orderId} className="flex items-center justify-between text-sm"><span>{r.restaurant?.name} · {r.code}</span><Link to={`/order/${r.orderId}`} className="font-bold text-brand-600">Rate it →</Link></li>)}</ul></Card>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between"><h2 className="font-display text-xl font-bold">Recent orders</h2><Link to="/account/orders" className="text-sm font-bold text-brand-600">View all →</Link></div>
        {recent.length ? <div className="space-y-3">{recent.map((o) => (
          <Link key={o.id} to={`/order/${o.id}`} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white p-4 transition hover:border-brand-200">
            <div><div className="font-semibold">{o.restaurantName || o.code}</div><div className="text-xs text-ink-500">{when(o.createdAt)}</div></div>
            <div className="text-right"><div className="font-bold">{money(o.total ?? o.subtotal)}</div><span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTone(o.status)}`}>{statusLabel(o)}</span></div>
          </Link>))}</div> : !loading && <p className="text-sm text-ink-500">Nothing here yet.</p>}
      </section>

      {ref && (
        <Card className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div><h3 className="font-display text-xl font-bold">Give {money(ref.rewards.referee)}, get {money(ref.rewards.referrer)}</h3><p className="mt-1 text-sm text-ink-500">{ref.shareText}</p>
            <p className="mt-2 text-xs text-ink-500">{ref.stats.invited} invited · {ref.stats.rewarded} rewarded · {money(ref.stats.earned)} earned</p></div>
          <button onClick={() => { navigator.clipboard?.writeText(ref.code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }} className="rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-5 py-3 text-center font-extrabold tracking-widest text-brand-700">{ref.code}<span className="block text-[10px] font-semibold tracking-normal text-ink-500">{copied ? 'Copied ✓' : 'Tap to copy'}</span></button>
        </Card>
      )}
    </div>
  )
}
