import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAsync } from '../utils/useAsync'
import VendorCard from '../components/VendorCard'
import Hero from '../components/Hero'
import { Offers, Cuisines, Trending, Highlights } from '../components/HomeSections'
import { useLocation2 } from '../context/LocationContext'
import { SectionTitle, Skeleton, Thumb } from '../components/ui'

const Grid = ({ list, n = 8 }) => (
  <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
    {list ? list.slice(0, n).map((r) => <VendorCard key={r.id} vendor={r} />) : Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}
  </div>
)

export default function Home() {
  const { city, loc, serviceable } = useLocation2()
  const { data: home, error } = useAsync(() => api.home('FOOD'), [loc?.lat, loc?.lng])
  const { data: stores } = useAsync(() => api.listStores(), [loc?.lat, loc?.lng])
  const { data: storeTypes } = useAsync(() => api.listStoreTypes('RETAIL'), [loc?.lat, loc?.lng])
  const { data: coupons } = useAsync(() => api.listCoupons(), [loc?.lat, loc?.lng])
  const empty = home && stores && !home.nearby.length && !home.popular.length && !stores.length

  return (
    <div>
      <Hero banner={home?.banners?.[0]} />
      <div className="container-x space-y-14 py-12">
        {!serviceable && <p className="rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">We don’t deliver to your current location yet. Choose an area from “Deliver to” in the header to see restaurants.</p>}
        {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">Couldn’t load restaurants right now. Please try again shortly.</p>}
        <Offers coupons={coupons || []} banners={home?.banners || []} />
        <Cuisines cats={home?.cuisines} />
        {empty && <p className="rounded-3xl border border-dashed border-ink-300 p-10 text-center text-ink-500">No restaurants are open near {city || 'you'} yet. Check back soon!</p>}
        {home?.popular.length > 0 && <Trending list={home.popular} />}
        {(!home || home.nearby.length > 0) && (
          <section>
            <SectionTitle title="Restaurants near you" subtitle={`Handpicked favourites${city ? ` in ${city}` : ' near you'}`} action={<Link to="/restaurants" className="text-sm font-bold text-brand-600">See all →</Link>} />
            <Grid list={home?.nearby} />
          </section>
        )}
        {stores?.length > 0 && (
          <section>
            <SectionTitle title="Groceries & shops" subtitle="Stock up from stores near you" action={<Link to="/groceries" className="text-sm font-bold text-brand-600">All stores →</Link>} />
            {storeTypes?.some((t) => t.count > 0) && (
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {storeTypes.filter((t) => t.count > 0).map((t) => (
                  <Link key={t.type} to={`/groceries?type=${t.type}`} className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-200">
                    <Thumb emoji={{ GROCERY: '🛒', CONVENIENCE: '🏪', SPECIALTY: '🥩' }[t.type] || '🛍️'} bg={{ GROCERY: '#d9f7f1', CONVENIENCE: '#fff0c2', SPECIALTY: '#ffe0e7' }[t.type] || '#dff0ff'} className="h-12 w-12 rounded-xl" size="text-2xl" />
                    <div><div className="text-sm font-bold group-hover:text-brand-600">{t.pluralLabel}</div><div className="text-xs text-ink-500">{t.count} nearby</div></div>
                  </Link>
                ))}
              </div>
            )}
            <Grid list={stores} n={4} />
          </section>
        )}
        {home?.fastest.length > 0 && (
          <section>
            <SectionTitle title="Fastest delivery" subtitle="Hot food, quickly" />
            <Grid list={home.fastest} n={4} />
          </section>
        )}
        {home?.new.length > 0 && (
          <section>
            <SectionTitle title="New on Forky" />
            <Grid list={home.new} n={4} />
          </section>
        )}
        <Highlights />
      </div>
    </div>
  )
}
