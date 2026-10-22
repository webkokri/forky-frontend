import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TagSearch from './TagSearch'
import { ModeToggle } from '../context/ModeContext'
import { useLocation2 } from '../context/LocationContext'

// One big idea: search what you want. A simple rotating plate shows what's on offer.
const SLIDES = [
  { emoji: '🍕', label: 'Pizza', to: '/restaurants?cuisine=pizza', glow: 'from-brand-500 to-pink-500' },
  { emoji: '🍔', label: 'Burgers', to: '/restaurants?cuisine=burgers', glow: 'from-brand-500 to-sun-500' },
  { emoji: '🍣', label: 'Sushi', to: '/restaurants?cuisine=sushi', glow: 'from-pink-500 to-violet-500' },
  { emoji: '🥦', label: 'Groceries', to: '/groceries', glow: 'from-teal-500 to-cyan-500' },
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
    <section className="relative isolate overflow-hidden bg-ink-900 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(circle_at_80%_20%,rgba(124,92,255,.5),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(238,80,52,.4),transparent_45%)]" />
      <div className="container-x grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold ring-1 ring-white/20">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />
            {status === 'loading' ? 'Finding your area…' : `Delivering in ${label || 'your area'}`}
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Food & groceries,<br />
            <span className="bg-gradient-to-r from-brand-400 via-pink-500 to-violet-300 bg-clip-text text-transparent">delivered fast.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-white/70">Type what you’re craving. We’ll find the closest places that have it.</p>

          <div className="mt-8 max-w-xl">
            <TagSearch large onSubmit={go} placeholder="biryani, pizza, milk…" className="!shadow-2xl !shadow-black/40" prefix={<span className="shrink-0 text-lg" aria-hidden>🔍</span>} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ModeToggle />
              <span className="hidden text-sm text-white/50 sm:inline">or try</span>
              {TRY.map((t) => <button key={t} onClick={() => go(t.split(',').map((x) => x.trim()))} className="rounded-full border border-white/25 px-3 py-1 text-sm font-semibold text-white/90 transition hover:bg-white hover:text-ink-900">{t}</button>)}
            </div>
          </div>
        </div>

        {/* simple rotating plate */}
        <div className="hidden lg:block" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className={`absolute inset-4 rounded-full bg-gradient-to-br ${s.glow} opacity-40 blur-3xl transition-all duration-700`} />
            <div className="absolute inset-0 rounded-full ring-1 ring-white/15" />
            <div className="absolute inset-8 rounded-full bg-white/10 ring-1 ring-white/25 backdrop-blur-xl" />
            <a href={s.to} onClick={(e) => { e.preventDefault(); nav(s.to) }} aria-label={`Browse ${s.label}`} className="absolute inset-0 grid place-items-center">
              <span key={i} className="animate-popin select-none text-[10rem] leading-none drop-shadow-2xl">{s.emoji}</span>
            </a>
            <div className="absolute -left-2 top-12 animate-floaty rounded-2xl bg-white px-3.5 py-2 text-sm font-bold text-ink-900 shadow-xl">🛵 30 min</div>
            <div className="absolute -right-2 bottom-24 animate-floaty rounded-2xl bg-white px-3.5 py-2 text-sm font-bold text-ink-900 shadow-xl [animation-delay:1.5s]">⭐ Top rated</div>
            <div className="absolute inset-x-0 -bottom-2 flex items-center justify-center gap-2">
              {SLIDES.map((x, n) => <button key={x.label} onClick={() => setI(n)} aria-label={`Show ${x.label}`} className={`h-2 rounded-full transition-all ${n === i ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`} />)}
            </div>
          </div>
          <p className="mt-6 text-center text-sm font-semibold text-white/70">{s.label}</p>
        </div>
      </div>
    </section>
  )
}
