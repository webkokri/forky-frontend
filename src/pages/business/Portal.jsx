import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api } from '../../api'
import { usePartner } from '../../context/PartnerAuth'
import { useAsync } from '../../utils/useAsync'
import { Card, PageHead } from '../../components/AccountLayout'
import { DocRow, Field, field } from '../../components/PartnerKit'
import { Skeleton } from '../../components/ui'

const STAGES = [['APPLIED', 'Applied'], ['DOCS_REVIEW', 'Documents review'], ['MENU_SETUP', 'Menu setup'], ['TEST_ORDER', 'Test order'], ['LIVE', 'Live']]
const INFO = {
  APPLIED: 'We’ve received your application. Upload your documents so we can start the review.',
  DOCS_REVIEW: 'Our team is reviewing your documents. We’ll let you know if anything else is needed.',
  MENU_SETUP: 'Documents approved! Next we’ll set up your menu and opening hours.',
  TEST_ORDER: 'Almost there. We’ll run a test order before you go live.',
  LIVE: 'You’re live and visible to customers. 🎉',
  PAUSED: 'Your store is paused. Contact partner support to resume.',
  SUSPENDED: 'Your store is suspended. Please contact partner support.',
  REJECTED: 'Unfortunately we can’t onboard this business right now.',
}
const TABS = [['/business/onboarding', 'Overview', true], ['/business/onboarding/documents', 'Documents'], ['/business/onboarding/hours', 'Opening hours'], ['/business/onboarding/payouts', 'Payouts']]

export function BusinessLayout() {
  const { user, ready, logout } = usePartner('restaurant')
  const { pathname } = useLocation()
  if (!ready) return <div className="container-x py-12"><Skeleton className="h-64" /></div>
  if (!user) return <Navigate to="/business/login" replace state={{ from: pathname }} />
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Business onboarding</p><h1 className="font-display text-3xl font-bold">Hi {user.firstName}</h1></div><button onClick={logout} className="btn-ghost">Sign out</button></div>
      <nav className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">{TABS.map(([to, l, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:bg-brand-50'}`}>{l}</NavLink>)}</nav>
      <Outlet />
    </div>
  )
}

export function BusinessOverview() {
  const { data: d, loading, error } = useAsync(() => api.businessDashboard(), [])
  const { state } = useLocation()
  if (loading) return <Skeleton className="h-64" />
  if (error) return <p className="text-sm text-rose-600">{error.message}</p>
  const r = d.restaurant
  const at = STAGES.findIndex(([k]) => k === r.status)
  const cl = d.documentChecklist
  return (
    <div className="space-y-6">
      <Card className="!border-brand-200 !bg-brand-50">
        <div className="text-xs font-bold uppercase tracking-wider text-brand-600">{r.name} · {r.storeTypeLabel}</div>
        <h2 className="mt-1 font-display text-2xl font-bold">{STAGES.find(([k]) => k === r.status)?.[1] || r.status.replace(/_/g, ' ')}</h2>
        <p className="mt-1 text-sm text-ink-700">{INFO[r.status] || ''}</p>
        {state?.verification?.nextStep && <p className="mt-2 text-sm font-semibold text-brand-700">Next: {state.verification.nextStep}</p>}
      </Card>
      <Card>
        <h2 className="font-display text-xl font-bold">Onboarding progress</h2>
        <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{STAGES.map(([k, l], i) => (
          <li key={k} className="text-sm"><div className={`mb-2 h-1.5 rounded-full ${at >= 0 && i <= at ? 'bg-brand-500' : 'bg-ink-100'}`} /><span className={`font-semibold ${i === at ? 'text-brand-600' : ''}`}>{l}</span></li>
        ))}</ol>
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">
        {[['/business/onboarding/documents', '📄', 'Documents', `${cl?.approved ?? 0} of ${cl?.total ?? 0} approved`], ['/business/onboarding/hours', '🕒', 'Opening hours', 'Tell customers when you’re open'], ['/business/onboarding/payouts', '🏦', 'Payouts', 'Add your bank details']].map(([to, e, t, s]) => (
          <Link key={to} to={to} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:border-brand-200"><div className="text-3xl">{e}</div><div className="mt-2 font-bold">{t}</div><div className="text-xs text-ink-500">{s}</div></Link>
        ))}
      </div>
      <p className="rounded-2xl bg-cream p-4 text-sm text-ink-700">🍴 <b>Menu & orders:</b> once your documents are approved our team will help you set up your menu. After you go live you’ll manage orders from the Forky restaurant portal.</p>
    </div>
  )
}

const DOC_LABEL = { BUSINESS_LICENCE: ['Business licence', 'Your municipal business licence'], HEALTH_CERTIFICATE: ['Health / food-handler certificate', 'Public health inspection or food-handler certificate'], VOID_CHEQUE: ['Void cheque or bank letter', 'Used to set up your payouts'], HST_CERTIFICATE: ['HST registration', 'Optional'], AGREEMENT: ['Signed agreement', ''], MENU: ['Menu or product list', 'PDF or photos of your menu'], PHOTOS: ['Photos', 'Storefront and food photos'], OTHER: ['Other document', ''] }
const EXPIRES = ['BUSINESS_LICENCE', 'HEALTH_CERTIFICATE']
const OPTIONAL = ['MENU', 'PHOTOS', 'HST_CERTIFICATE']

export function BusinessDocuments() {
  const { data: cl, reload } = useAsync(() => api.businessChecklist(), [])
  const { data: docs, reload: reloadDocs } = useAsync(() => api.businessDocuments(), [])
  const refresh = () => { reload(); reloadDocs() }
  const items = cl?.items || []
  const optional = OPTIONAL.filter((t) => !items.some((i) => i.type === t)).map((type) => { const d = (docs || []).filter((x) => x.type === type).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]; return { type, status: d?.status || 'MISSING', docId: d?.id, expiresAt: d?.expiresAt, rejectReason: d?.rejectReason } })
  const row = (i, extra) => {
    const [label, hint] = DOC_LABEL[i.type] || [i.type, '']
    return <DocRow key={i.type} role="restaurant" label={`${label}${i.required === false || extra ? ' (optional)' : ''}`} hint={hint} status={i.status} rejectReason={i.rejectReason} expiresAt={i.expiresAt?.slice?.(0, 10)} expiryField={EXPIRES.includes(i.type)} onRegister={(b) => api.addBusinessDocument({ type: i.type, ...b })} onDone={refresh} />
  }
  return (
    <div>
      <PageHead title="Documents" subtitle={cl ? `${cl.approved} of ${cl.total} required documents approved. PNG, JPEG, WebP or PDF, up to 10 MB.` : ''} />
      <div className="space-y-4">{items.map((i) => row(i))}{!cl && <Skeleton className="h-32" />}</div>
      {optional.length > 0 && <><h2 className="mb-3 mt-8 font-display text-xl font-bold">Additional documents</h2><div className="space-y-4">{optional.map((i) => row(i, true))}</div></>}
    </div>
  )
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export function BusinessHours() {
  const { data } = useAsync(() => api.businessHours(), [])
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState(null)
  useEffect(() => { if (data) setRows(DAYS.map((_, d) => { const h = data.find((x) => x.dayOfWeek === d); return h ? { openTime: h.closed ? '09:00' : h.openTime, closeTime: h.closed ? '21:00' : h.closeTime, closed: h.closed } : { openTime: '09:00', closeTime: '21:00', closed: false } })) }, [data])
  const upd = (d, k, v) => setRows((r) => r.map((x, i) => (i === d ? { ...x, [k]: v } : x)))
  const save = async () => { setMsg(null); try { await api.saveBusinessHours(rows.map((r, dayOfWeek) => ({ dayOfWeek, ...(r.closed ? { closed: true } : { openTime: r.openTime, closeTime: r.closeTime, closed: false }) }))); setMsg({ ok: true, text: 'Opening hours saved.' }) } catch (x) { setMsg({ ok: false, text: x.message }) } }
  if (!rows) return <Skeleton className="h-64" />
  return (
    <div className="max-w-2xl">
      <PageHead title="Opening hours" subtitle="Customers can order during these hours once you’re live." />
      <Card><ul className="divide-y divide-ink-100">{rows.map((r, d) => (
        <li key={d} className="flex flex-wrap items-center gap-3 py-3 text-sm"><span className="w-28 font-semibold">{DAYS[d]}</span>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={r.closed} onChange={(e) => upd(d, 'closed', e.target.checked)} className="accent-brand-500" />Closed</label>
          {!r.closed && <><input type="time" value={r.openTime} onChange={(e) => upd(d, 'openTime', e.target.value)} className="rounded-lg border border-ink-100 px-2 py-1" /><span>to</span><input type="time" value={r.closeTime} onChange={(e) => upd(d, 'closeTime', e.target.value)} className="rounded-lg border border-ink-100 px-2 py-1" /></>}
        </li>))}</ul>
        {msg && <p className={`mt-3 text-sm font-semibold ${msg.ok ? 'text-mint-600' : 'text-rose-600'}`}>{msg.text}</p>}
        <button onClick={save} className="btn-primary mt-4">Save hours</button></Card>
    </div>
  )
}

export function BusinessPayouts() {
  const { data: bank, reload } = useAsync(() => api.businessBank().catch(() => null), [])
  const [f, setF] = useState({ holder: '', institution: '', transit: '', accountNumber: '' })
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => { e.preventDefault(); setMsg(null); try { await api.saveBusinessBank(f); setMsg({ ok: true, text: 'Bank details saved. We’ll verify them before your first payout.' }); setF({ holder: '', institution: '', transit: '', accountNumber: '' }); reload() } catch (x) { setMsg({ ok: false, text: x.message }) } }
  const b = bank?.bank
  return (
    <div className="max-w-2xl">
      <PageHead title="Payouts" subtitle="Where we send your sales, minus our commission." />
      {b && <Card className="mb-5"><div className="text-xs font-bold uppercase tracking-wider text-brand-600">On file</div><div className="mt-1 font-bold">{b.holder || bank.name}</div><div className="text-sm text-ink-500">{b.institution && `Institution ${b.institution} · `}Account {b.account || ''}{bank.verified ? ' · Verified' : ' · Awaiting verification'}</div></Card>}
      <Card><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Account holder"><input required value={f.holder} onChange={set('holder')} className={field} /></Field>
        <Field label="Institution no." hint="3 digits"><input required inputMode="numeric" maxLength={3} value={f.institution} onChange={set('institution')} className={field} /></Field>
        <Field label="Transit no." hint="5 digits"><input required inputMode="numeric" maxLength={5} value={f.transit} onChange={set('transit')} className={field} /></Field>
        <Field label="Account number"><input required inputMode="numeric" value={f.accountNumber} onChange={set('accountNumber')} className={field} /></Field>
        {msg && <p className={`text-sm font-semibold sm:col-span-2 ${msg.ok ? 'text-mint-600' : 'text-rose-600'}`}>{msg.text}</p>}
        <div className="sm:col-span-2"><button className="btn-primary">{b ? 'Update bank details' : 'Save bank details'}</button></div>
      </form></Card>
    </div>
  )
}
