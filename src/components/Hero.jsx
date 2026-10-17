import { Link, useNavigate } from 'react-router-dom'
import TagSearch from './TagSearch'
import { useLocation2 } from '../context/LocationContext'

const TRY = ['biryani, pizza', 'milk, bread, eggs', 'dosa, filter coffee']

function Tile({ to, className = '', children }) {
  return <Link to={to} className={`group relative overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${className}`}>{children}</Link>
}

export default function Hero({ banner }) {
  const nav = useNavigate()
  const { label, status } = useLocation2()
  const go = (terms) => nav(`/search?q=${encodeURIComponent(terms.join(','))}`)

  return (
    <section className="relative isolate overflow-hidden border-b border-brand-100 bg-gradient-to-br from-[#fff6d6] via-[#ffe3c9] to-[#ffc3b0]">
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(circle_at_85%_15%,rgba(255,193,7,.45),transparent_45%),radial-gradient(circle_at_5%_95%,rgba(20,184,166,.22),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.35] [background-image:radial-gradient(rgba(176,48,26,.35)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom_left,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="container-x relative grid items-center gap-12 py-12 md:py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink-700 shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
            Delivering in {status === 'loading' ? 'your area…' : label || 'your area'}
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            Cravings in.<br />
            <span className="relative text-brand-500">Wait out.
              <svg aria-hidden viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full text-brand-300" fill="none"><path d="M2 8c50-8 100-8 148-3s100 4 148-2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
            </span>
          </h1>
          <p className="mt-7 max-w-md text-lg text-ink-500">Tell us everything you’re after, separated by commas. We’ll find the closest kitchens and stores that have it.</p>

          <div className="mt-8 max-w-xl rounded-3xl border border-ink-100 bg-white p-3 shadow-card">
            <TagSearch large shape="rounded-2xl" onSubmit={go} placeholder="biryani, pizza, milk…" className="bg-cream !shadow-none !ring-0 focus-within:!ring-2 focus-within:!ring-brand-500"
              prefix={<span className="shrink-0 text-lg" aria-hidden>🔍</span>} />
            <div className="flex flex-wrap items-center gap-2 px-1 pb-1 pt-3 text-sm">
              <span className="text-ink-500">Try</span>
              {TRY.map((t) => (
                <button key={t} onClick={() => go(t.split(',').map((x) => x.trim()))} className="rounded-full border border-ink-100 px-3 py-1 font-semibold text-ink-700 transition hover:border-brand-500 hover:text-brand-600">{t}</button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-ink-700">
            {[['🛒', 'Food & groceries'], ['🛵', 'Live order tracking'], ['🏷️', 'Offers every day']].map(([e, t]) => <span key={t}>{e} {t}</span>)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Tile to="/restaurants" className="row-span-2 flex min-h-[22rem] flex-col justify-between bg-brand-500 text-white">
            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">Offer</span>
              <h3 className="mt-4 font-display text-4xl font-bold leading-none">{banner?.title || 'Order your favourites'}</h3>
              <p className="mt-2 text-sm text-white/85">{banner?.subtitle || 'Local restaurants, delivered fast.'}</p>
            </div>
            <span className="-mb-4 -mr-2 self-end text-[8rem] leading-none drop-shadow-xl transition group-hover:rotate-6 group-hover:scale-110">🍕</span>
          </Tile>
          <Tile to="/groceries" className="bg-teal-600 text-white">
            <div className="font-display text-xl font-bold leading-tight">Groceries delivered</div>
            <div className="mt-6 text-5xl transition group-hover:scale-110">🥦</div>
          </Tile>
          <Tile to="/restaurants?cuisine=desserts" className="bg-sun-300 text-ink-900">
            <div className="font-display text-xl font-bold leading-tight">Sweet cravings</div>
            <div className="mt-6 text-5xl transition group-hover:scale-110">🍰</div>
          </Tile>
          <Tile to="/restaurants" className="col-span-2 flex items-center justify-between bg-sky-100">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-700">Explore</div>
              <div className="mt-1 font-display text-xl font-bold">Browse every cuisine</div>
              <div className="mt-1 text-sm text-ink-500">Pizza, sushi, burgers and more near you</div>
            </div>
            <span className="text-5xl transition group-hover:scale-110">🍜</span>
          </Tile>
        </div>
      </div>
    </section>
  )
}
