import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAsync, money } from '../utils/useAsync'
import VendorCard from '../components/VendorCard'
import TagSearch, { parseTerms } from '../components/TagSearch'
import { useLocation2 } from '../context/LocationContext'
import { AddButton, ErrorState, SectionTitle, Skeleton, Thumb } from '../components/ui'

export default function Search() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const q = params.get('q') || ''
  const { label, loc } = useLocation2()
  const terms = parseTerms(q)
  const { data, loading, error } = useAsync(() => (q ? api.search(q) : Promise.resolve(null)), [q, loc?.lat, loc?.lng])

  return (
    <div className="container-x py-8">
      <TagSearch key={q} large initial={terms} onSubmit={(t) => nav(`/search?q=${encodeURIComponent(t.join(','))}`)} placeholder="Dishes or restaurants, separated by commas" className="ring-ink-100 shadow-card" />
      {q && <p className="mt-3 text-sm text-ink-500">Nearest places{label ? ` around ${label}` : ''} for {terms.map((t, i) => <b key={t} className="text-ink-700">{i ? ', ' : ''}{t}</b>)}</p>}
      {!q && <p className="py-16 text-center text-ink-500">Try “biryani, pizza, coffee” — separate items with commas.</p>}
      {error && <ErrorState error={error} />}
      {q && loading && <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>}
      {data && (
        <div className="mt-8 space-y-12">
          {data.restaurants.length > 0 && (
            <section>
              <SectionTitle title="Restaurants" subtitle={`${data.restaurants.length} match${data.restaurants.length > 1 ? 'es' : ''}`} />
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
                {data.restaurants.map((r) => (
                  <div key={r.id}>
                    <VendorCard vendor={r} />
                    {terms.length > 1 && <p className="mt-2 px-1 text-xs font-semibold text-brand-700">✓ Has {r.matched?.join(', ')} ({r.matched?.length}/{terms.length})</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {data.products.length > 0 && (
            <section>
              <SectionTitle title="Dishes & products" subtitle={`${data.products.length} found`} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                {data.products.map((p) => (
                  <div key={p.id} className="flex flex-col rounded-2xl border border-ink-100 bg-white p-3 shadow-card">
                    <Thumb emoji={p.emoji} bg={p.bg} src={p.image} className="aspect-square w-full rounded-xl" size="text-4xl" />
                    <h4 className="mt-2 text-sm font-semibold">{p.name}</h4>
                    <p className="text-xs text-ink-500">{p.unit ? `${p.unit} · ` : ''}{p.store.name}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <span className="text-sm font-extrabold">{money(p.price)}</span>
                      <AddButton vendor={p.store} item={p} disabled={!p.store.isOpen || !p.available} compact />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {!data.restaurants.length && !data.products.length && <p className="py-16 text-center text-ink-500">Nothing found near you for “{q}”.</p>}
        </div>
      )}
    </div>
  )
}
