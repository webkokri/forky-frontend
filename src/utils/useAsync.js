import { useCallback, useEffect, useState } from 'react'

export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    // A manual reload (tick > 0) refreshes quietly without flashing a skeleton.
    if (tick === 0) setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ data: tick ? s.data : null, error: tick ? null : error, loading: false })))
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { ...state, reload }
}

const CAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
export const money = (n) => CAD.format(Number(n) || 0)
