import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TagSearch from './TagSearch'
import { ModeToggle } from '../context/ModeContext'
import { useLocation2 } from '../context/LocationContext'

// One big idea: search what you want. The phone on the right replays how it works: type a list, get the nearest places.
const WANTS = ['biryani', 'pizza', 'milk']
const RESULTS = [['🍛', 'Spice Kitchen', '2 of 3 items', '25 min'], ['🛒', 'Fresh Market', 'All 3 items', '18 min'], ['🍕', 'Slice House', '2 of 3 items', '30 min']]
const TRY = ['biryani, pizza', 'milk, bread, eggs']

export default function Hero() {
  const nav = useNavigate()
  const { label, status } = useLocation2()
  const [tick, setTick] = useState(0)
  const go = (terms) => nav(`/search?q=${encodeURIComponent(terms.join(','))}`)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setTick(6); return undefined }
    const id = setInterval(() => setTick((n) => (n + 1) % 10), 900)
    return () => clearInterval(id)
  }, [])
  const chips = Math.min(tick, 3)       // 0..3 chips typed
  const results = tick >= 4 ? Math.min(tick - 3, 3) : 0 // 0..3 result cards

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

        {/* phone replaying the list search */}
        <div className="relative mx-auto hidden h-[30rem] w-full max-w-sm lg:block" aria-hidden>
          <div className="absolute -left-10 bottom-36 z-10 animate-floaty rounded-2xl bg-white px-3.5 py-2 text-sm font-bold shadow-xl">⚡ Found in 1 search</div>
          <div className="absolute -right-6 bottom-24 z-10 animate-floaty rounded-2xl bg-teal-500 px-3.5 py-2 text-sm font-bold text-white shadow-xl [animation-delay:1.6s]">🛵 From 18 min</div>

          <div className="absolute inset-x-8 top-0 rotate-3 rounded-[2.5rem] bg-ink-900 p-2.5 shadow-2xl shadow-brand-900/30">
            <div className="relative h-[28.5rem] overflow-hidden rounded-[2rem] bg-[#fffaf3]">
              <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-ink-900" />
              <div className="px-4 pt-9">
                <div className="text-[11px] font-semibold text-ink-500">📍 Near you</div>
                <div className="mt-2 flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-2xl bg-white p-2 shadow-card ring-1 ring-ink-100">
                  {WANTS.slice(0, chips).map((w) => <span key={w} className="animate-popin rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">{w}</span>)}
                  {chips < 3 && <span className="h-4 w-px animate-pulse bg-ink-700" />}
                </div>
                <div className="mt-4 space-y-2.5">
                  {RESULTS.slice(0, results).map(([e, name, has, eta]) => (
                    <div key={name} className="flex animate-popin items-center gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-ink-100">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sun-100 text-2xl">{e}</span>
                      <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{name}</div><div className="text-[11px] font-semibold text-teal-700">✓ {has}</div></div>
                      <span className="rounded-full bg-ink-900 px-2 py-1 text-[10px] font-bold text-white">{eta}</span>
                    </div>
                  ))}
                  {results === 0 && <div className="pt-10 text-center text-xs text-ink-300">Type what you want, separated by commas</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
