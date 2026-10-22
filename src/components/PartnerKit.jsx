import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export const field = 'mt-1 w-full rounded-xl border border-ink-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500'
export const Field = ({ label, hint, children }) => <label className="block text-sm font-semibold">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-ink-500">{hint}</span>}</label>

// Landing-page hero shared by /drive and /business.
export function PartnerHero({ eyebrow, title, accent, text, primary, secondary, emoji }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-900 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background:radial-gradient(circle_at_85%_15%,rgba(124,92,255,.5),transparent_42%),radial-gradient(circle_at_10%_95%,rgba(238,80,52,.45),transparent_42%)]" />
      <div className="container-x grid items-center gap-10 py-16 md:grid-cols-[1.2fr_.8fr] md:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">{eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{title} <span className="bg-gradient-to-r from-brand-400 via-pink-500 to-violet-300 bg-clip-text text-transparent">{accent}</span></h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">{text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={primary.to} className="btn bg-white px-6 py-3 text-ink-900 shadow-lg hover:bg-violet-50">{primary.label} →</Link>
            {secondary && <Link to={secondary.to} className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">{secondary.label}</Link>}
          </div>
        </div>
        <div className="hidden md:block"><div className="mx-auto grid aspect-square w-72 place-items-center rounded-full bg-white/10 text-[9rem] shadow-2xl shadow-violet-900/50 ring-1 ring-white/25 backdrop-blur-xl">{emoji}</div></div>
      </div>
    </section>
  )
}

export const Steps = ({ items }) => (
  <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {items.map(([t, d], i) => <li key={t} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 font-bold text-white">{i + 1}</span><h3 className="mt-3 font-bold">{t}</h3><p className="mt-1 text-sm text-ink-500">{d}</p></li>)}
  </ol>
)

export const Benefits = ({ items }) => (
  <div className="grid gap-4 sm:grid-cols-3">
    {items.map(([e, t, d]) => <div key={t} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100"><div className="text-3xl">{e}</div><h3 className="mt-3 font-display text-lg font-bold">{t}</h3><p className="mt-1 text-sm text-ink-500">{d}</p></div>)}
  </div>
)

// Wizard step header (numbered progress bar).
export function Stepper({ steps, index }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${i < index ? 'bg-mint-500 text-white' : i === index ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500'}`}>{i < index ? '✓' : i + 1}</span>
          <span className={`hidden text-sm font-semibold sm:block ${i === index ? 'text-ink-900' : 'text-ink-500'}`}>{s}</span>
          {i < steps.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < index ? 'bg-mint-500' : 'bg-ink-100'}`} />}
        </li>
      ))}
    </ol>
  )
}

const DOC_STATUS = { APPROVED: ['Approved', 'bg-mint-500/15 text-mint-600'], PENDING: ['In review', 'bg-amber-100 text-amber-700'], REJECTED: ['Rejected', 'bg-rose-100 text-rose-700'], EXPIRED: ['Expired', 'bg-rose-100 text-rose-700'], MISSING: ['Needed', 'bg-ink-100 text-ink-700'] }
export const DocBadge = ({ status }) => { const [l, c] = DOC_STATUS[status] || DOC_STATUS.MISSING; return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c}`}>{l}</span> }

// One required document: status + upload button (uploads the file, then registers it).
export function DocRow({ label, hint, status, rejectReason, expiresAt, expiryField, role, onRegister, onDone }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [exp, setExp] = useState('')
  const pick = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setBusy(true); setErr('')
    try {
      const up = await api.upload(file, role)
      await onRegister({ fileUrl: up.url, fileName: file.name, ...(exp ? { expiresAt: exp } : {}) })
      onDone?.()
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const uploaded = status && status !== 'MISSING'
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="font-bold">{label}</div>{hint && <p className="text-xs text-ink-500">{hint}</p>}{expiresAt && <p className="text-xs text-ink-500">Expires {expiresAt}</p>}</div>
        <DocBadge status={status || 'MISSING'} />
      </div>
      {status === 'REJECTED' && rejectReason && <p className="mt-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700">Reason: {rejectReason}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {expiryField && <label className="text-xs font-semibold">Expiry date<input type="date" value={exp} onChange={(e) => setExp(e.target.value)} className="ml-2 rounded-lg border border-ink-100 px-2 py-1" /></label>}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="hidden" onChange={pick} />
        <button disabled={busy || (expiryField && !exp)} onClick={() => input.current?.click()} className={uploaded ? 'btn-ghost' : 'btn-primary'}>{busy ? 'Uploading…' : uploaded ? 'Replace file' : 'Upload file'}</button>
        {expiryField && !exp && <span className="text-xs text-ink-500">Choose the expiry date first</span>}
      </div>
      {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}
    </div>
  )
}
