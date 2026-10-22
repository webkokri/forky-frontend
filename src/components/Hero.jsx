import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TagSearch from './TagSearch'
import { ModeToggle } from '../context/ModeContext'
import { useLocation2 } from '../context/LocationContext'

// One big idea: search what you want. A simple rotating plate shows what's on offer.
const SLIDES = [
  { emoji: '🍕', label: 'Pizza', to: '/restaurants?cuisine=pizza', glow: 'from-brand-500 to-pink-500' },
  { emoji: '🍔', label: 'Burgers', to: '/restaurants?cuisine=burgers', glow: 'from-brand-500 to-sun-500' },
  { emoji: '🍣', label: 'Sushi', to: '/restaurants?cuisine=sushi', glow: 'from-pink-500 to-sun-500' },
  { emoji: '🥦', label: 'Groceries', to: '/groceries', glow: 'from-teal-500 to-sun-500' },
]
const TRY = ['biryani, pizza', 'milk, bread, eggs']

export default function Hero() {
  const nav = useNavigate()
  const { label, status } = useLocation2()
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const go = (terms) => nav(`/search?q=${encodeURIComponent(terms.join(','))}`)
  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), 2800)
    return () => clearTimeout(t)
  }, [i, paused])
  const s = SLIDES[i]

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

        {/* simple rotating plate */}
        <div className="hidden lg:block" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className={`absolute inset-4 rounded-full bg-gradient-to-br ${s.glow} opacity-30 blur-3xl transition-all duration-700`} />
            <div className="absolute inset-0 rounded-full border border-white/70" />
            <div className="absolute inset-8 rounded-full bg-white/70 shadow-xl ring-1 ring-white backdrop-blur-xl" />
            <a href={s.to} onClick={(e) => { e.preventDefault(); nav(s.to) }} aria-label={`Browse ${s.label}`} className="absolute inset-0 grid place-items-center">
              <span key={i} className="animate-popin select-none text-[10rem] leading-none drop-shadow-2xl">{s.emoji}</span>
            </a>
            <div className="absolute -left-2 top-12 animate-floaty rounded-2xl bg-white px-3.5 py-2 text-sm font-bold text-ink-900 shadow-xl">🛵 30 min</div>
            <div className="absolute -right-2 bottom-24 animate-floaty rounded-2xl bg-white px-3.5 py-2 text-sm font-bold text-ink-900 shadow-xl [animation-delay:1.5s]">⭐ Top rated</div>
            <div className="absolute inset-x-0 -bottom-2 flex items-center justify-center gap-2">
              {SLIDES.map((x, n) => <button key={x.label} onClick={() => setI(n)} aria-label={`Show ${x.label}`} className={`h-2 rounded-full transition-all ${n === i ? 'w-8 bg-brand-500' : 'w-2 bg-ink-300 hover:bg-ink-500'}`} />)}
            </div>
          </div>
          <p className="mt-6 text-center text-sm font-semibold text-ink-700">{s.label}</p>
        </div>
      </div>
    </section>
  )
}
