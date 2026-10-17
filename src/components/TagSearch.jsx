import { useRef, useState } from 'react'

export const parseTerms = (q = '') => [...new Set(q.split(',').map((t) => t.trim()).filter(Boolean))]

// Search box where each comma-separated item becomes a removable chip.
export default function TagSearch({ initial = [], onSubmit, placeholder, prefix, large, shape = 'rounded-full', className = '' }) {
  const [tags, setTags] = useState(initial)
  const [text, setText] = useState('')
  const input = useRef(null)

  const withText = (t = text) => parseTerms([...tags, ...t.split(',')].join(','))
  const add = (t) => { setTags(withText(t)); setText('') }
  const submit = () => { const all = withText(); setTags(all); setText(''); if (all.length) onSubmit(all) }

  const onChange = (e) => {
    const v = e.target.value
    if (v.includes(',')) { const parts = v.split(','); setTags(parseTerms([...tags, ...parts.slice(0, -1)].join(','))); setText(parts[parts.length - 1].trimStart()) } else setText(v)
  }
  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); submit() }
    else if (e.key === 'Backspace' && !text && tags.length) setTags(tags.slice(0, -1))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }} onClick={() => input.current?.focus()}
      className={`flex items-center gap-2 ${shape} bg-white text-ink-900 shadow-xl shadow-black/15 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-ink-900 ${large ? 'p-2 pl-5' : 'p-1.5 pl-4'} ${className}`}>
      {prefix}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-1">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={(e) => { e.stopPropagation(); setTags(tags.filter((x) => x !== t)) }} className="grid h-5 w-5 place-items-center rounded-full text-xs hover:bg-brand-200">✕</button>
          </span>
        ))}
        <input ref={input} value={text} onChange={onChange} onKeyDown={onKeyDown} onBlur={() => text.trim() && add(text)}
          placeholder={tags.length ? 'Add another…' : placeholder} className={`min-w-[8rem] flex-1 bg-transparent outline-none placeholder:text-ink-300 ${large ? 'h-10 text-base' : 'h-9 text-sm'}`} />
      </div>
      <button aria-label="Search" className={`grid shrink-0 place-items-center rounded-full bg-ink-900 text-lg font-bold text-white transition hover:bg-brand-500 ${large ? 'h-12 w-12' : 'h-10 w-10'}`}>→</button>
    </form>
  )
}
