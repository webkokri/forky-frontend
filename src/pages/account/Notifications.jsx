import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAsync } from '../../utils/useAsync'
import { when } from '../../utils/orders'
import { Empty, PageHead } from '../../components/AccountLayout'

export default function Notifications() {
  const { data, reload } = useAsync(() => api.listNotifications({ limit: 50 }), [])
  const list = data?.data || []
  const open = async (n) => { if (!n.readAt) { await api.markNotificationRead(n.id).catch(() => {}); reload() } }
  return (
    <div>
      <PageHead title="Notifications" subtitle={data ? `${data.unread ?? 0} unread` : ''} action={list.some((n) => !n.readAt) && <button onClick={async () => { await api.markAllNotificationsRead(); reload() }} className="btn-ghost">Mark all as read</button>} />
      <ul className="space-y-2">
        {list.map((n) => {
          const to = n.data?.orderId ? `/order/${n.data.orderId}` : null
          const body = <><div className="flex items-start gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.readAt ? 'bg-ink-100' : 'bg-brand-500'}`} /><div><div className="font-bold">{n.title}</div><p className="text-sm text-ink-700">{n.body}</p><div className="mt-1 text-xs text-ink-500">{when(n.createdAt)}</div></div></div></>
          return <li key={n.id}>{to ? <Link to={to} onClick={() => open(n)} className="block rounded-2xl border border-ink-100 bg-white p-4 hover:border-brand-200">{body}</Link> : <button onClick={() => open(n)} className="block w-full rounded-2xl border border-ink-100 bg-white p-4 text-left">{body}</button>}</li>
        })}
      </ul>
      {data && !list.length && <Empty icon="🔔" title="You’re all caught up" text="Order updates and offers will show up here." />}
    </div>
  )
}
