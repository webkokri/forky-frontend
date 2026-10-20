import { createContext, useCallback, useContext, useMemo, useState } from 'react'

// Global Delivery / Pickup choice (like the Forky mobile app): filters the store lists and is the
// default fulfilment at checkout.
const KEY = 'forky_mode'
const Ctx = createContext(null)
const read = () => { try { return localStorage.getItem(KEY) === 'pickup' ? 'pickup' : 'delivery' } catch { return 'delivery' } }

export function ModeProvider({ children }) {
  const [mode, setModeState] = useState(read)
  const setMode = useCallback((m) => { setModeState(m); try { localStorage.setItem(KEY, m) } catch { /* ignore */ } }, [])
  const value = useMemo(() => ({ mode, pickup: mode === 'pickup', setMode }), [mode, setMode])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export const useMode = () => useContext(Ctx)

export function ModeToggle({ className = '' }) {
  const { mode, setMode } = useMode()
  return (
    <div role="group" aria-label="Delivery or pickup" className={`inline-flex rounded-full bg-white p-1 shadow-card ring-1 ring-ink-100 ${className}`}>
      {[['delivery', '🛵', 'Delivery'], ['pickup', '🛍️', 'Pickup']].map(([m, e, l]) => (
        <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${mode === m ? 'bg-brand-500 text-white shadow' : 'text-ink-700 hover:text-brand-600'}`}><span aria-hidden>{e}</span>{l}</button>
      ))}
    </div>
  )
}
