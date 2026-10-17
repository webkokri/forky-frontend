import { useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api } from '../../api'
import { usePartner } from '../../context/PartnerAuth'
import { useAsync } from '../../utils/useAsync'
import { Card, PageHead } from '../../components/AccountLayout'
import { DocRow, Field, field } from '../../components/PartnerKit'
import { Skeleton } from '../../components/ui'

const STATUS = {
  APPLIED: ['Application received', 'We’ve got your application. Upload your documents to move forward.'],
  DOCS_REVIEW: ['Documents in review', 'Our team is reviewing your documents.'],
  BACKGROUND_CHECK: ['Background check', 'Your background check is in progress.'],
  TRAINING: ['Training', 'Complete the short training modules to continue.'],
  APPROVED: ['Approved', 'You’re approved! We’re setting up your delivery zones.'],
  ACTIVE: ['Active', 'You’re all set. Open the Forky driver app to go online.'],
  SUSPENDED: ['Account suspended', 'Please contact driver support.'],
  DEACTIVATED: ['Account deactivated', 'Please contact driver support.'],
  REJECTED: ['Application declined', 'Unfortunately we can’t offer you a driver account right now.'],
}
const TABS = [['/drive/onboarding', 'Overview', true], ['/drive/onboarding/documents', 'Documents'], ['/drive/onboarding/training', 'Training'], ['/drive/onboarding/payout', 'Payout details']]

export function DriveLayout() {
  const { user, ready, logout } = usePartner('driver')
  const { pathname } = useLocation()
  if (!ready) return <div className="container-x py-12"><Skeleton className="h-64" /></div>
  if (!user) return <Navigate to="/drive/login" replace state={{ from: pathname }} />
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Driver onboarding</p><h1 className="font-display text-3xl font-bold">Welcome, {user.firstName}</h1></div><button onClick={logout} className="btn-ghost">Sign out</button></div>
      <nav className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">{TABS.map(([to, l, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${isActive ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:bg-brand-50'}`}>{l}</NavLink>)}</nav>
      <Outlet />
    </div>
  )
}

export function DriveOverview() {
  const { data: p, loading } = useAsync(() => api.driverProfile(), [])
  const { data: c } = useAsync(() => api.driverChecklist(), [])
  const { state } = useLocation()
  if (loading) return <Skeleton className="h-64" />
  const ob = c || p?.onboarding
  const [title, text] = STATUS[ob?.status] || [ob?.status, '']
  const v = p?.verification || state?.verification
  return (
    <div className="space-y-6">
      <Card className="!border-brand-200 !bg-brand-50"><div className="text-xs font-bold uppercase tracking-wider text-brand-600">Status</div><h2 className="mt-1 font-display text-2xl font-bold">{title}</h2><p className="mt-1 text-sm text-ink-700">{ob?.statusReason || text}</p>{v?.nextStep && <p className="mt-2 text-sm font-semibold text-brand-700">Next: {v.nextStep}</p>}</Card>
      <Card>
        <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Your checklist</h2><b className="text-brand-600">{ob?.percent ?? 0}%</b></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${ob?.percent ?? 0}%` }} /></div>
        <ul className="mt-5 space-y-3">{(ob?.steps || []).map((s) => (
          <li key={s.key} className="flex items-start gap-3 text-sm"><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${s.done ? 'bg-mint-500 text-white' : 'bg-ink-100 text-ink-500'}`}>{s.done ? '✓' : '•'}</span><div><div className="font-semibold">{s.label}</div>{s.detail && <div className="text-xs text-ink-500">{s.detail}</div>}{!s.done && s.owner && <div className="text-[11px] font-bold uppercase text-ink-300">{s.owner === 'DRIVER' ? 'Your action' : 'We’re on it'}</div>}</div></li>
        ))}</ul>
        {ob?.driverActions?.length > 0 && <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">To do: {ob.driverActions.map((a) => a.label || a).join(', ')}</div>}
      </Card>
      <div className="grid gap-4 sm:grid-cols-3">{[['/drive/onboarding/documents', '📄', 'Upload documents'], ['/drive/onboarding/training', '🎓', 'Take the training'], ['/drive/onboarding/payout', '🏦', 'Add payout details']].map(([to, e, l]) => <Link key={to} to={to} className="rounded-2xl border border-ink-100 bg-white p-5 text-center font-semibold shadow-card transition hover:border-brand-200"><div className="text-3xl">{e}</div>{l}</Link>)}</div>
    </div>
  )
}

const DOC_LABEL = { LICENCE: ['Driver’s licence', 'Front of your valid licence'], VEHICLE_REGISTRATION: ['Vehicle registration', 'Current vehicle registration'], INSURANCE: ['Vehicle insurance', 'Proof of valid insurance'], PHOTO: ['Profile photo', 'A clear photo of your face'], WORK_ELIGIBILITY: ['Work eligibility', 'Proof you can work in Canada'], BACKGROUND_CHECK: ['Background check', 'Criminal record check result, if you have one'], OTHER: ['Other document', ''] }
const NEEDS_EXPIRY = ['LICENCE', 'VEHICLE_REGISTRATION', 'INSURANCE']

export function DriveDocuments() {
  const { data, reload } = useAsync(() => api.driverDocuments(), [])
  const history = data?.history || []
  return (
    <div>
      <PageHead title="Documents" subtitle="Upload clear photos or PDFs (PNG, JPEG, WebP or PDF, up to 10 MB)." />
      <div className="space-y-4">
        {(data?.required || []).map((r) => {
          const [label, hint] = DOC_LABEL[r.type] || [r.type, '']
          const last = history.filter((h) => h.type === r.type).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
          const status = !r.uploaded ? 'MISSING' : r.expired ? 'EXPIRED' : r.status
          return <DocRow key={r.type} role="driver" label={label} hint={hint} status={status} rejectReason={last?.rejectReason} expiresAt={r.expiresAt?.slice?.(0, 10)} expiryField={NEEDS_EXPIRY.includes(r.type)}
            onRegister={(b) => (r.documentId ? api.replaceDriverDocument(r.documentId, b) : api.addDriverDocument({ type: r.type, ...b }))} onDone={reload} />
        })}
        {!data && <Skeleton className="h-32" />}
      </div>
    </div>
  )
}

function Module({ m, onDone }) {
  const [open, setOpen] = useState(false)
  const [ans, setAns] = useState([])
  const [res, setRes] = useState(null)
  const [err, setErr] = useState('')
  const done = m.result?.passed
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try { const r = await api.submitQuiz(m.id, m.quiz.map((_, i) => ans[i] ?? -1)); setRes(r); onDone() } catch (x) { setErr(x.message) }
  }
  return (
    <Card>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left"><div><div className="font-bold">{m.title}</div><div className="text-xs text-ink-500">{done ? `Passed${m.result?.bestScore != null ? ` · best ${m.result.bestScore}%` : ''}` : `Pass mark ${m.passMark}%${m.result?.attempts ? ` · ${m.result.attempts} attempt(s)` : ''}`}</div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${done ? 'bg-mint-500/15 text-mint-600' : 'bg-ink-100 text-ink-700'}`}>{done ? 'Completed' : open ? 'Close' : 'Start'}</span></button>
      {open && (
        <div className="mt-4 space-y-5 border-t border-ink-100 pt-4">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{m.content}</p>
          <form onSubmit={submit} className="space-y-4">
            {m.quiz.map((q, qi) => <fieldset key={qi}><legend className="text-sm font-bold">{qi + 1}. {q.question}</legend><div className="mt-2 space-y-1.5">{q.options.map((o, oi) => <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm ${ans[qi] === oi ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}><input type="radio" name={`${m.id}-${qi}`} checked={ans[qi] === oi} onChange={() => setAns((a) => { const n = [...a]; n[qi] = oi; return n })} className="accent-brand-500" />{o}</label>)}</div></fieldset>)}
            {err && <p className="text-sm text-rose-600">{err}</p>}
            {res && <p className={`rounded-xl p-3 text-sm font-semibold ${res.passed ? 'bg-mint-500/10 text-mint-600' : 'bg-amber-50 text-amber-800'}`}>{res.passed ? 'Great job, you passed!' : 'Not quite. Review the material and try again.'} {res.score != null && `Score: ${res.score}%`}</p>}
            <button disabled={ans.filter((a) => a != null).length < m.quiz.length} className="btn-primary">Submit answers</button>
          </form>
        </div>
      )}
    </Card>
  )
}

export function DriveTraining() {
  const { data, reload } = useAsync(() => api.driverTraining(), [])
  return (
    <div>
      <PageHead title="Training" subtitle={data ? (data.completed ? 'All modules completed. Nice work!' : `Pass each quiz with ${data.passMark}% or more.`) : ''} />
      <div className="space-y-4">{(data?.modules || []).map((m) => <Module key={m.id} m={m} onDone={reload} />)}{!data && <Skeleton className="h-32" />}{data && !data.modules.length && <p className="text-sm text-ink-500">No training is required right now.</p>}</div>
    </div>
  )
}

export function DrivePayout() {
  const { data: acct } = useAsync(() => api.driverProfile().then((p) => p.payoutSchedule && p), [])
  const [f, setF] = useState({ holder: '', institution: '', transit: '', accountNumber: '', currentPassword: '' })
  const [msg, setMsg] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setMsg(null)
    try { await api.saveDriverBank(f); setMsg({ ok: true, text: 'Payout details saved.' }); setF({ holder: '', institution: '', transit: '', accountNumber: '', currentPassword: '' }) } catch (x) { setMsg({ ok: false, text: x.message }) }
  }
  return (
    <div className="max-w-2xl">
      <PageHead title="Payout details" subtitle={`Where should we send your earnings?${acct?.payoutSchedule ? ` Payouts are ${String(acct.payoutSchedule).toLowerCase()}.` : ''} You can add this later; it’s only needed to get paid.`} />
      <Card><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Account holder"><input required value={f.holder} onChange={set('holder')} className={field} /></Field>
        <Field label="Institution no." hint="3 digits"><input required inputMode="numeric" maxLength={3} value={f.institution} onChange={set('institution')} className={field} /></Field>
        <Field label="Transit no." hint="5 digits"><input required inputMode="numeric" maxLength={5} value={f.transit} onChange={set('transit')} className={field} /></Field>
        <Field label="Account number"><input required inputMode="numeric" value={f.accountNumber} onChange={set('accountNumber')} className={field} /></Field>
        <div className="sm:col-span-2"><Field label="Your password" hint="Required to change payout details."><input required type="password" autoComplete="current-password" value={f.currentPassword} onChange={set('currentPassword')} className={field} /></Field></div>
        {msg && <p className={`text-sm font-semibold sm:col-span-2 ${msg.ok ? 'text-mint-600' : 'text-rose-600'}`}>{msg.text}</p>}
        <div className="sm:col-span-2"><button className="btn-primary">Save payout details</button></div>
      </form></Card>
    </div>
  )
}
