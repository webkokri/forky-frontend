import { Link, useNavigate } from 'react-router-dom'
import TagSearch from './TagSearch'
import { ModeToggle } from '../context/ModeContext'
import { useLocation2 } from '../context/LocationContext'

// One big idea: search what you want. The two big cards on the right are the two ways in: food or groceries.
const TRY = ['biryani, pizza', 'milk, bread, eggs']

export default function Hero({ banner }) {
  const nav = useNavigate()
  const { label, status } = useLocation2()
  const go = (terms) => nav(`/search?q=${encodeURIComponent(terms.join(','))}`)

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

        {/* two big doors: restaurants and groceries, plus the current offer */}
        <div className="relative mx-auto hidden h-[30rem] w-full max-w-md lg:block">
          <Link to="/restaurants" className="group absolute left-0 top-0 h-72 w-60 -rotate-3 overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 to-pink-500 p-6 text-white shadow-2xl shadow-brand-900/25 transition duration-300 hover:-translate-y-2 hover:rotate-0">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">Restaurants</span>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight">Hot meals,<br />nearby</h3>
            <span aria-hidden className="absolute -bottom-4 -right-3 text-[9rem] leading-none drop-shadow-xl transition duration-300 group-hover:scale-110 group-hover:rotate-6">🍕</span>
            <span className="absolute bottom-5 left-6 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-brand-600">Order food →</span>
          </Link>
          <Link to="/groceries" className="group absolute right-0 top-14 h-72 w-56 rotate-3 overflow-hidden rounded-[2rem] bg-gradient-to-br from-teal-500 to-sky-500 p-6 text-white shadow-2xl shadow-teal-900/25 transition duration-300 hover:-translate-y-2 hover:rotate-0">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">Groceries</span>
            <h3 className="mt-2 font-display text-3xl font-bold leading-tight">Fresh to<br />your door</h3>
            <span aria-hidden className="absolute -bottom-3 -right-2 text-[8rem] leading-none drop-shadow-xl transition duration-300 group-hover:scale-110 group-hover:-rotate-6">🥦</span>
            <span className="absolute bottom-5 left-6 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-teal-700">Shop now →</span>
          </Link>
          <Link to="/restaurants" className="group absolute bottom-0 left-8 right-6 flex items-center gap-4 rounded-3xl bg-white p-4 pr-5 shadow-2xl shadow-ink-900/15 ring-1 ring-ink-100 transition duration-300 hover:-translate-y-1">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sun-300 text-3xl">🏷️</span>
            <div className="min-w-0 flex-1"><div className="text-xs font-bold uppercase tracking-wider text-ink-500">Offer</div><div className="truncate font-display text-lg font-bold">{banner?.title || 'Deals every day'}</div>{banner?.subtitle && <div className="truncate text-xs text-ink-500">{banner.subtitle}</div>}</div>
            <span className="text-xl font-bold text-brand-500 transition group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
