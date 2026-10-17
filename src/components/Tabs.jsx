export default function Tabs({ tabs, value, onChange }) {
  return (
    <div className="no-scrollbar sticky top-16 z-20 -mx-4 flex gap-6 overflow-x-auto border-b border-ink-100 bg-white px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={`relative whitespace-nowrap py-3.5 text-sm font-bold transition ${value === t.id ? 'text-brand-600' : 'text-ink-500 hover:text-ink-900'}`}>
          {t.label}{t.count != null && <span className="ml-1 font-medium text-ink-300">{t.count}</span>}
          {value === t.id && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-500" />}
        </button>
      ))}
    </div>
  )
}
