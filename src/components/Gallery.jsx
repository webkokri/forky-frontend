import { useEffect, useState } from 'react'
import { Thumb } from './ui'

// Gallery items use { emoji, bg } placeholders. With real data, pass { url }
// and the <img> branch renders instead.
function Tile({ g, className, size }) {
  return g.url
    ? <img src={g.url} alt={g.caption} className={`object-cover ${className}`} />
    : <Thumb emoji={g.emoji} bg={g.bg} className={className} size={size} />
}

export default function Gallery({ items }) {
  const [open, setOpen] = useState(null)
  useEffect(() => {
    if (open == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i + 1) % items.length)
      if (e.key === 'ArrowLeft') setOpen((i) => (i - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, items.length])

  return (
    <>
      <div className="grid auto-rows-[140px] grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((g, i) => (
          <button key={g.id} onClick={() => setOpen(i)} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
            <Tile g={g} className="h-full w-full transition group-hover:scale-105" size={i === 0 ? 'text-8xl' : 'text-5xl'} />
            <span className="absolute bottom-2 left-2 rounded-lg bg-white/90 px-2 py-0.5 text-xs font-semibold opacity-0 transition group-hover:opacity-100">{g.caption}</span>
          </button>
        ))}
      </div>
      {open != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 p-4" onClick={() => setOpen(null)}>
          <button className="absolute right-5 top-4 text-3xl text-white" aria-label="Close">×</button>
          <button className="absolute left-4 text-4xl text-white" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + items.length) % items.length) }}>‹</button>
          <figure className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <Tile g={items[open]} className="aspect-[4/3] w-full rounded-2xl" size="text-[10rem]" />
            <figcaption className="mt-3 text-center text-sm text-white">{items[open].caption} · {open + 1}/{items.length}</figcaption>
          </figure>
          <button className="absolute right-4 text-4xl text-white" aria-label="Next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % items.length) }}>›</button>
        </div>
      )}
    </>
  )
}
