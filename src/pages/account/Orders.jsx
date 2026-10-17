import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { useAsync, money } from '../../utils/useAsync'
import { isActiveOrder, isCancelled, statusLabel, statusTone, when } from '../../utils/orders'
import { Empty, PageHead } from '../../components/AccountLayout'
import { ErrorState, Skeleton } from '../../components/ui'

const TABS = [['all', 'All'], ['active', 'Active'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'all'
  const { data, loading, error } = useAsync(() => api.listOrders(), [])
  if (error) return <ErrorState error={error} />
  const all = data?.data || []
  const filters = { all: () => true, active: isActiveOrder, completed: (o) => !isActiveOrder(o) && !isCancelled(o), cancelled: isCancelled }
  const shown = all.filter(filters[tab])

  return (
    <div>
      <PageHead title="Orders" subtitle="Track current orders and look back at past ones." />
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setParams(k === 'all' ? {} : { tab: k })} className={`chip ${tab === k ? 'chip-active' : ''}`}>{l} <span className="text-ink-300">({all.filter(filters[k]).length})</span></button>)}
      </div>
      <div className="space-y-3">
        {loading && <><Skeleton className="h-24" /><Skeleton className="h-24" /></>}
        {shown.map((o) => (
          <Link key={o.id} to={`/order/${o.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:border-brand-200">
            <div className="min-w-0"><div className="truncate font-bold">{o.restaurantName || 'Order'}</div><div className="text-sm text-ink-500">{o.code} · {when(o.createdAt)}</div><div className="mt-1 text-xs text-ink-500">{o.type === 'PICKUP' ? 'Pickup' : 'Delivery'}</div></div>
            <div className="shrink-0 text-right"><div className="font-bold">{money(o.total ?? o.subtotal)}</div><span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusTone(o.status)}`}>{statusLabel(o)}</span></div>
          </Link>
        ))}
        {!loading && !shown.length && <Empty icon="📦" title={tab === 'active' ? 'No active orders' : 'No orders here'} text="Your orders will appear here." action={<Link to="/restaurants" className="btn-primary">Browse restaurants</Link>} />}
      </div>
    </div>
  )
}
