import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { useAsync } from '../../utils/useAsync'
import { when } from '../../utils/orders'
import { Card, Empty, PageHead } from '../../components/AccountLayout'

const field = 'mt-1 w-full rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500'

function Thread({ id, onBack }) {
  const { data: t } = useAsync(() => api.getTicket(id), [id])
  const { data: msgs, reload } = useAsync(() => api.ticketMessages(id), [id])
  const [text, setText] = useState('')
  const list = Array.isArray(msgs) ? msgs : msgs?.data || []
  return (
    <div>
      <button onClick={onBack} className="mb-3 text-sm font-bold text-brand-600">← All tickets</button>
      <Card>
        <h2 className="font-display text-xl font-bold">{t?.subject || 'Ticket'}</h2><p className="text-xs text-ink-500">{t?.status?.replace(/_/g, ' ')}</p>
        <ul className="mt-4 space-y-3">{list.map((m) => <li key={m.id} className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.senderType === 'CUSTOMER' || m.fromCustomer ? 'ml-auto bg-brand-500 text-white' : 'bg-cream'}`}>{m.body}<div className="mt-1 text-[10px] opacity-70">{when(m.createdAt)}</div></li>)}</ul>
        <form onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await api.sendTicketMessage(id, text.trim()); setText(''); reload() }} className="mt-4 flex gap-2"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" className="h-11 flex-1 rounded-xl border border-ink-100 px-3 text-sm outline-none focus:border-brand-500" /><button className="btn-primary">Send</button></form>
      </Card>
    </div>
  )
}

export default function Support() {
  const [params, setParams] = useSearchParams()
  const open = params.get('ticket')
  const { data: tickets, reload } = useAsync(() => api.listTickets(), [])
  const { data: types } = useAsync(() => api.issueTypes().catch(() => []), [])
  const { data: orders } = useAsync(() => api.listOrders({ limit: 10 }), [])
  const [creating, setCreating] = useState(false)
  const [f, setF] = useState({ category: 'OTHER', subject: '', body: '', orderId: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const list = Array.isArray(tickets) ? tickets : tickets?.data || []

  if (open) return <Thread id={open} onBack={() => setParams({})} />
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try { const t = await api.createTicket({ category: f.category, subject: f.subject, body: f.body, ...(f.orderId ? { orderId: f.orderId } : {}) }); setCreating(false); setF({ category: 'OTHER', subject: '', body: '', orderId: '' }); reload(); if (t?.id) setParams({ ticket: t.id }) } catch (x) { setErr(x.message) }
  }
  return (
    <div>
      <PageHead title="Help & support" subtitle="Something wrong with an order? We’re here." action={!creating && <button onClick={() => setCreating(true)} className="btn-primary">+ New request</button>} />
      <p className="mb-5 text-sm text-ink-500">Looking for quick answers? Read the <Link to="/faq" className="font-bold text-brand-600">FAQ</Link>.</p>
      {creating && (
        <Card className="mb-6"><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">What happened?<select value={f.category} onChange={set('category')} className={field}>{(types?.length ? types : [{ category: 'OTHER', label: 'Something else' }]).map((t) => <option key={t.category} value={t.category}>{t.label}</option>)}<option value="OTHER">Something else</option></select></label>
          <label className="text-xs font-semibold">Related order (optional)<select value={f.orderId} onChange={set('orderId')} className={field}><option value="">None</option>{(orders?.data || []).map((o) => <option key={o.id} value={o.id}>{o.code} · {o.restaurantName}</option>)}</select></label>
          <label className="text-xs font-semibold sm:col-span-2">Subject<input required value={f.subject} onChange={set('subject')} className={field} /></label>
          <label className="text-xs font-semibold sm:col-span-2">Details<textarea required rows={4} value={f.body} onChange={set('body')} className={field} /></label>
          {err && <p className="text-sm text-rose-600 sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2"><button className="btn-primary">Send request</button><button type="button" onClick={() => setCreating(false)} className="btn-ghost">Cancel</button></div>
        </form></Card>
      )}
      <div className="space-y-3">
        {list.map((t) => <button key={t.id} onClick={() => setParams({ ticket: t.id })} className="flex w-full items-center justify-between rounded-2xl border border-ink-100 bg-white p-4 text-left shadow-card hover:border-brand-200"><div><div className="font-bold">{t.subject}</div><div className="text-xs text-ink-500">{when(t.createdAt)}</div></div><span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">{t.status?.replace(/_/g, ' ')}</span></button>)}
        {tickets && !list.length && !creating && <Empty icon="💬" title="No support requests" text="If you need a hand, start a new request." />}
      </div>
    </div>
  )
}
