import { useMemo, useState } from 'react'
import { money } from '../utils/useAsync'

// Lets the customer pick options (sizes, extras, ...) before adding a dish.
// Returns a cart line whose id is unique per option combination.
export default function ModifierModal({ item, onAdd, onClose }) {
  const groups = item.modifierGroups || []
  const [sel, setSel] = useState(() => Object.fromEntries(groups.map((g) => [g.id, g.options.filter((o) => o.isDefault && o.available !== false).map((o) => o.id)])))
  const [note, setNote] = useState('')

  const toggle = (g, id) => setSel((s) => {
    const cur = s[g.id] || []
    if (g.maxSelect === 1) return { ...s, [g.id]: [id] }
    if (cur.includes(id)) return { ...s, [g.id]: cur.filter((x) => x !== id) }
    if (g.maxSelect && cur.length >= g.maxSelect) return s
    return { ...s, [g.id]: [...cur, id] }
  })

  const { extra, ids, missing } = useMemo(() => {
    let extra = 0; const ids = []; const missing = []
    groups.forEach((g) => {
      const chosen = sel[g.id] || []
      chosen.forEach((id) => { ids.push(id); extra += g.options.find((o) => o.id === id)?.priceDelta || 0 })
      const min = Math.max(g.minSelect || 0, g.required ? 1 : 0)
      if (chosen.length < min) missing.push(g.name)
    })
    return { extra, ids, missing }
  }, [groups, sel])

  const unit = item.price + extra
  const submit = () => {
    const label = groups.flatMap((g) => (sel[g.id] || []).map((id) => g.options.find((o) => o.id === id)?.name)).filter(Boolean).join(', ')
    onAdd({ ...item, id: `${item.id}:${[...ids].sort().join(',')}:${note}`, menuItemId: item.id, modifierOptionIds: ids, price: unit, optionsLabel: label, notes: note || undefined, modifierGroups: undefined })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-ink-900/50 sm:place-items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-ink-100 p-5">
          <h3 className="font-display text-xl font-bold">{item.name}</h3>
          {item.description && <p className="mt-1 text-sm text-ink-500">{item.description}</p>}
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {groups.map((g) => (
            <fieldset key={g.id}>
              <legend className="flex w-full items-center justify-between font-bold">
                {g.name}
                <span className="text-xs font-semibold text-ink-500">{g.required ? 'Required' : 'Optional'}{g.maxSelect > 1 ? ` · up to ${g.maxSelect}` : ''}</span>
              </legend>
              <div className="mt-2 space-y-2">
                {g.options.map((o) => (
                  <label key={o.id} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${o.available === false ? 'opacity-40' : 'cursor-pointer'} ${(sel[g.id] || []).includes(o.id) ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>
                    <input type={g.maxSelect === 1 ? 'radio' : 'checkbox'} name={g.id} disabled={o.available === false} checked={(sel[g.id] || []).includes(o.id)} onChange={() => toggle(g, o.id)} className="accent-brand-500" />
                    <span className="flex-1 font-semibold">{o.name}</span>
                    {o.priceDelta > 0 && <span className="text-ink-500">+{money(o.priceDelta)}</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <label className="block text-sm font-bold">Special instructions
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} placeholder="e.g. no onions" className="mt-1 w-full rounded-xl border border-ink-100 px-3 py-2 text-sm font-normal outline-none focus:border-brand-500" />
          </label>
        </div>
        <div className="border-t border-ink-100 p-5">
          {missing.length > 0 && <p className="mb-2 text-xs text-rose-600">Choose: {missing.join(', ')}</p>}
          <button disabled={missing.length > 0} onClick={submit} className="btn-primary w-full py-3">Add to cart · {money(unit)}</button>
        </div>
      </div>
    </div>
  )
}
