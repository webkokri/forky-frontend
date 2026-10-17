import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAsync } from '../utils/useAsync'

const slugify = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function Faq({ items }) {
  return (
    <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
      {items.map((f) => (
        <details key={f.q} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
            {f.q}<span className="text-xl text-brand-500 transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 leading-relaxed text-ink-500">{f.a}</p>
        </details>
      ))}
    </div>
  )
}

function Contact({ s }) {
  const topic0 = new URLSearchParams(window.location.search).get('topic') || s.topics?.[0]?.[0]
  const [f, setF] = useState({ topic: topic0, name: '', email: '', message: '' })
  const [state, setState] = useState('idle')
  const { data: config } = useAsync(() => api.getConfig(), [])
  const email = config?.settings?.['general.supportEmail']
  const phone = config?.settings?.['general.supportPhone']
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault(); setState('sending')
    try { await api.sendContact(f); setState('sent') } catch (x) {
      // Not signed in: hand the message to the visitor's email app instead.
      if (x.code === 'NO_AUTH' && email) { window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Forky: ${f.topic}`)}&body=${encodeURIComponent(`${f.message}\n\n${f.name} <${f.email}>`)}`; setState('sent') } else setState('error')
    }
  }
  const field = 'mt-1 w-full rounded-xl border border-ink-100 bg-white px-4 py-2.5 outline-none focus:border-brand-500'
  return (
    <div className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
      {state === 'sent' ? (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center"><div className="text-4xl">✅</div><h3 className="mt-3 font-display text-xl font-bold">Message sent</h3><p className="mt-1 text-ink-500">Thanks, we’ll get back to you soon.</p></div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <label className="block text-sm font-semibold">Topic
            <select value={f.topic} onChange={set('topic')} className={field}>{(s.topics || []).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold">Name<input required value={f.name} onChange={set('name')} className={field} /></label>
            <label className="block text-sm font-semibold">Email<input required type="email" value={f.email} onChange={set('email')} className={field} /></label>
          </div>
          <label className="block text-sm font-semibold">Message<textarea required rows={5} value={f.message} onChange={set('message')} className={field} /></label>
          {state === 'error' && <p className="text-sm text-rose-600">Something went wrong. Please try again.</p>}
          <button disabled={state === 'sending'} className="btn-primary">{state === 'sending' ? 'Sending…' : 'Send message'}</button>
        </form>
      )}
      <dl className="space-y-4 rounded-2xl bg-cream p-6">
        {[...(email ? [['Email', email]] : []), ...(phone ? [['Phone', phone]] : []), ...(s.details || []).filter(([k]) => k === 'Hours')].map(([k, v]) => <div key={k}><dt className="text-xs font-bold uppercase tracking-wider text-brand-600">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>)}
      </dl>
    </div>
  )
}

export function Section({ s }) {
  const head = s.heading && <h2 id={slugify(s.heading)} className="scroll-mt-24 font-display text-2xl font-bold tracking-tight">{s.heading}</h2>
  switch (s.type) {
    case 'text':
      return <section>{head}<div className="mt-3 space-y-4 leading-relaxed text-ink-700">{s.body.map((p, i) => <p key={i}>{p}</p>)}</div></section>
    case 'list':
      return <section>{head}<ul className="mt-4 grid gap-3 sm:grid-cols-2">{s.items.map((i) => <li key={i} className="flex gap-3 rounded-xl border border-ink-100 bg-white p-4 text-ink-700"><span className="text-brand-500">●</span>{i}</li>)}</ul></section>
    case 'steps':
      return <section>{head}<ol className="mt-5 grid gap-4 sm:grid-cols-3">{s.items.map((i, n) => <li key={i.title} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-500 font-bold text-white">{n + 1}</span><h3 className="mt-3 font-bold">{i.title}</h3><p className="mt-1 text-sm text-ink-500">{i.text}</p></li>)}</ol></section>
    case 'stats':
      return <section className="grid gap-4 sm:grid-cols-3">{s.items.map((i) => <div key={i.label} className="rounded-2xl bg-brand-500 p-6 text-white"><div className="font-display text-4xl font-bold">{i.value}</div><div className="mt-1 text-sm text-white/85">{i.label}</div></div>)}</section>
    case 'faq':
      return <section>{head}<div className="mt-4"><Faq items={s.items} /></div></section>
    case 'cta':
      return (
        <section className="rounded-3xl bg-ink-900 p-8 text-center text-white sm:p-12">
          <h2 className="font-display text-3xl font-bold">{s.heading}</h2>
          <p className="mx-auto mt-3 max-w-md text-ink-300">{s.text}</p>
          {s.button && <Link to={s.button.to} className="btn mt-6 bg-brand-500 px-6 py-3 text-white hover:bg-brand-600">{s.button.label} →</Link>}
        </section>
      )
    case 'contact':
      return <section>{head}<div className="mt-4"><Contact s={s} /></div></section>
    default:
      return null
  }
}

export { slugify }
