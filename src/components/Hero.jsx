import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TagSearch from './TagSearch'
import { ModeToggle } from '../context/ModeContext'
import { useLocation2 } from '../context/LocationContext'

// One big idea: search what you want. The visual on the right shows an order moving along, step by step.
const STEPS = [['🍳', 'Preparing', 'Your food is being made'], ['🛵', 'On the way', 'Your courier is heading to you'], ['🏠', 'Delivered', 'Enjoy your meal!']]
const TRY = ['biryani, pizza', 'milk, bread, eggs']

export default function Hero() {
  const nav = useNavigate()
  const { label, status } = useLocation2()
  const [step, setStep] = useState(1)
  const go = (terms) => nav(`/search?q=${encodeURIComponent(terms.join(','))}`)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const id = setInterval(() => setStep((n) => (n + 1) % STEPS.length), 2600)
    return () => clearInterval(id)
  }, [])
  const [icon, title, sub] = STEPS[step]

  return (
    <section className="relative isolate overflow-hidden border-b border-brand-100 bg-gradient-to-br from-[#fff6d6] via-[#ffe3c9] to-[#ffc3b0]">
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(circle_at_85%_15%,rgba(255,193,7,.45),transparent_45%),radial-gradient(circle_at_5%_95%,rgba(20,184,166,.22),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.35] [background-image:radial-gradient(rgba(176,48,26,.35)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]" />
      <div className="container-x grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink-700 shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
            {status === 'loading' ? 'Finding your area…' : `Delivering in ${label || 'your area'}`}
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            Food & groceries,<br />
            <span className="text-brand-500">delivered fast.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-ink-500">Type what you’re craving. We’ll find the closest places that have it.</p>

          <div className="mt-8 max-w-xl">
            <TagSearch large onSubmit={go} placeholder="biryani, pizza, milk…" className="!shadow-xl !shadow-brand-900/10" prefix={<span className="shrink-0 text-lg" aria-hidden>🔍</span>} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ModeToggle />
              <span className="hidden text-sm text-ink-500 sm:inline">or try</span>
              {TRY.map((t) => <button key={t} onClick={() => go(t.split(',').map((x) => x.trim()))} className="rounded-full border border-ink-100 bg-white/70 px-3 py-1 text-sm font-semibold text-ink-700 transition hover:border-brand-500 hover:text-brand-600">{t}</button>)}
            </div>
          </div>
        </div>

        {/* live-order card with floating food tiles */}
        <div className="relative mx-auto hidden h-[26rem] w-full max-w-md lg:block" aria-hidden>
          <div className="absolute -right-10 -top-6 z-10 grid h-24 w-24 rotate-6 animate-floaty place-items-center rounded-3xl bg-teal-500 text-5xl shadow-xl shadow-teal-900/20">🥦</div>
          <div className="absolute -left-10 bottom-14 z-10 grid h-20 w-20 -rotate-12 animate-floaty place-items-center rounded-3xl bg-pink-500 text-4xl shadow-xl shadow-pink-900/20 [animation-delay:1.2s]">🍣</div>
          <div className="absolute -bottom-4 right-0 z-10 grid h-24 w-24 -rotate-6 animate-floaty place-items-center rounded-3xl bg-sun-300 text-5xl shadow-xl shadow-sun-700/20 [animation-delay:2.4s]">🍔</div>

          <div className="absolute inset-x-6 top-10 rotate-[-3deg] rounded-[2rem] bg-white p-6 shadow-2xl shadow-brand-900/20 ring-1 ring-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-500">Your order</span>
              <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-700">● Live</span>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <span key={step} className="grid h-16 w-16 shrink-0 animate-popin place-items-center rounded-2xl bg-brand-50 text-4xl">{icon}</span>
              <div><div className="font-display text-2xl font-bold leading-tight">{title}</div><div className="text-sm text-ink-500">{sub}</div></div>
            </div>
            <div className="mt-6 flex items-center gap-2">
              {STEPS.map(([, label], n) => <span key={label} className={`h-2 flex-1 rounded-full transition-all duration-500 ${n <= step ? 'bg-brand-500' : 'bg-ink-100'}`} />)}
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-500">{STEPS.map(([, label], n) => <span key={label} className={n === step ? 'text-brand-600' : ''}>{label}</span>)}</div>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-cream px-4 py-3 text-sm"><span className="text-ink-500">Arriving in</span><b className="font-display text-lg">{step === 2 ? 'Now' : step === 1 ? '12 min' : '25 min'}</b></div>
          </div>
        </div>
      </div>
    </section>
  )
}
