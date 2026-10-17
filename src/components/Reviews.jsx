import { Rating } from './ui'

export default function Reviews({ vendor }) {
  const reviews = vendor.reviews || []
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => Math.round(r.rating) === s).length }))
  const tags = vendor.ratingSummary?.topTags || []

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-6">
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <div className="text-4xl font-extrabold">{vendor.rating == null ? 'New' : Number(vendor.rating).toFixed(1)}</div>
          <Rating value={vendor.rating} count={vendor.ratingCount} className="mt-1" />
          {reviews.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {dist.map(({ s, n }) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-3">{s}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-mint-500" style={{ width: `${(n / reviews.length) * 100}%` }} /></div>
                  <span className="w-4 text-right text-ink-500">{n}</span>
                </div>
              ))}
            </div>
          )}
          {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{tags.map((t) => <span key={t.tag || t.name || t} className="chip">{t.tag || t.name || t}</span>)}</div>}
        </div>
        <p className="rounded-2xl bg-cream p-4 text-sm text-ink-500">Reviews can be left after you’ve received an order from this restaurant.</p>
      </aside>
      <ul className="divide-y divide-ink-100">
        {reviews.map((r) => (
          <li key={r.id} className="py-5 first:pt-0">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{r.author[0]}</div>
              <div>
                <div className="font-semibold">{r.author}</div>
                <div className="text-xs text-ink-500">{new Date(r.date).toLocaleDateString('en-CA', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <span className={`ml-auto rounded-lg px-2 py-0.5 text-xs font-bold text-white ${r.rating >= 4 ? 'bg-mint-500' : r.rating === 3 ? 'bg-amber-500' : 'bg-rose-500'}`}>{r.rating} ★</span>
            </div>
            {r.text && <p className="mt-3 text-sm text-ink-700">{r.text}</p>}
          </li>
        ))}
        {!reviews.length && <li className="py-10 text-center text-ink-500">No reviews yet.</li>}
      </ul>
    </div>
  )
}
