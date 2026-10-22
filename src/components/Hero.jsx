import { Link, useNavigate } from 'react-router-dom'
import TagSearch from './TagSearch'
import { ModeToggle } from '../context/ModeContext'
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
    <section className="relative isolate overflow-hidden bg-ink-900 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(circle_at_85%_10%,rgba(124,92,255,.55),transparent_42%),radial-gradient(circle_at_8%_90%,rgba(238,80,52,.45),transparent_42%),radial-gradient(circle_at_55%_55%,rgba(22,199,232,.14),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[.22] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="container-x relative grid items-center gap-12 py-12 md:py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white ring-1 ring-white/20 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500 shadow-[0_0_10px_2px_rgba(22,199,232,.8)]" />
            Delivering in {status === 'loading' ? 'your area…' : label || 'your area'}
          </span>
          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Cravings in.<br />
            <span className="bg-gradient-to-r from-brand-400 via-pink-500 to-violet-300 bg-clip-text text-transparent">Wait out.</span>
          </h1>
          <p className="mt-7 max-w-md text-lg text-white/70">Tell us everything you’re after, separated by commas. We’ll find the closest kitchens and stores that have it.</p>

          <ModeToggle className="mt-7" />
          <div className="mt-4 max-w-xl rounded-3xl bg-white/10 p-3 shadow-2xl shadow-black/30 ring-1 ring-white/20 backdrop-blur-xl">
            <TagSearch large shape="rounded-2xl" onSubmit={go} placeholder="biryani, pizza, milk…" className="!shadow-none !ring-0 focus-within:!ring-2 focus-within:!ring-violet-500"
              prefix={<span className="shrink-0 text-lg" aria-hidden>🔍</span>} />
            <div className="flex flex-wrap items-center gap-2 px-1 pb-1 pt-3 text-sm">
              <span className="text-white/60">Try</span>
              {TRY.map((t) => (
                <button key={t} onClick={() => go(t.split(',').map((x) => x.trim()))} className="rounded-full border border-white/25 px-3 py-1 font-semibold text-white/90 transition hover:border-white hover:bg-white hover:text-ink-900">{t}</button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-white/80">
            {[['🛒', 'Food & groceries'], ['🛵', 'Live order tracking'], ['🏷️', 'Offers every day']].map(([e, t]) => <span key={t}>{e} {t}</span>)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Tile to="/restaurants" className="row-span-2 flex min-h-[22rem] flex-col justify-between bg-gradient-to-br from-brand-500 to-pink-500 text-white shadow-2xl shadow-brand-500/30">
            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">Offer</span>
              <h3 className="mt-4 font-display text-4xl font-bold leading-none">{banner?.title || 'Order your favourites'}</h3>
              <p className="mt-2 text-sm text-white/90">{banner?.subtitle || 'Local restaurants, delivered fast.'}</p>
            </div>
            <span className="-mb-4 -mr-2 self-end text-[8rem] leading-none drop-shadow-xl transition group-hover:rotate-6 group-hover:scale-110">🍕</span>
          </Tile>
          <Tile to="/groceries" className="bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-xl shadow-violet-900/40">
            <div className="font-display text-xl font-bold leading-tight">Groceries delivered</div>
            <div className="mt-6 text-5xl transition group-hover:scale-110">🥦</div>
          </Tile>
          <Tile to="/restaurants?cuisine=desserts" className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-ink-900 shadow-xl shadow-cyan-900/30">
            <div className="font-display text-xl font-bold leading-tight">Sweet cravings</div>
            <div className="mt-6 text-5xl transition group-hover:scale-110">🍰</div>
          </Tile>
          <Tile to="/restaurants" className="col-span-2 flex items-center justify-between bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-500">Explore</div>
              <div className="mt-1 font-display text-xl font-bold">Browse every cuisine</div>
              <div className="mt-1 text-sm text-white/65">Pizza, sushi, burgers and more near you</div>
            </div>
            <span className="text-5xl transition group-hover:scale-110">🍜</span>
          </Tile>
        </div>
      </div>
    </section>
  )
}
