import { Skeleton } from './ui'

// Placed after a list: shows skeleton cards while the next page loads and triggers loading when scrolled near.
export default function InfiniteSentinel({ inf, count = 4, className = '' }) {
  return (
    <>
      {inf.more && <div className={`mt-6 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4 ${className}`}>{Array.from({ length: count }, (_, i) => <Skeleton key={i} className="aspect-[4/3]" />)}</div>}
      {inf.error && <p className="mt-6 text-center text-sm text-rose-600">Couldn’t load more. <button onClick={inf.retry} className="font-bold underline">Try again</button></p>}
      {inf.hasMore && <div ref={inf.sentinelRef} aria-hidden className="h-8" />}
      {!inf.hasMore && !inf.loading && inf.items.length > 0 && <p className="mt-8 text-center text-sm text-ink-500">You’ve reached the end 🍽️</p>}
    </>
  )
}
