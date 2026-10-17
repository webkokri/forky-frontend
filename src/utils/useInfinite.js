import { useCallback, useEffect, useRef, useState } from 'react'

// Infinite scroll: loads page 1, then the next page whenever the sentinel element nears the viewport.
// fetchPage(page) must resolve to { items, meta: { page, totalPages } }. The list resets when `deps` change.
export function useInfinite(fetchPage, deps) {
  const [state, setState] = useState({ items: [], page: 0, totalPages: 1, loading: true, more: false, error: null })
  const busy = useRef(false)
  const gen = useRef(0)
  const fetchRef = useRef(fetchPage)
  fetchRef.current = fetchPage

  const load = useCallback(async (page, reset) => {
    if (busy.current) return
    busy.current = true
    const g = gen.current
    setState((s) => ({ ...s, loading: reset, more: !reset, error: null }))
    try {
      const { items, meta } = await fetchRef.current(page)
      if (g !== gen.current) return
      setState((s) => ({ items: reset ? items : [...s.items, ...items], page: meta?.page ?? page, totalPages: meta?.totalPages ?? 1, loading: false, more: false, error: null }))
    } catch (error) {
      if (g === gen.current) setState((s) => ({ ...s, loading: false, more: false, error }))
    } finally { if (g === gen.current) busy.current = false }
  }, [])

  useEffect(() => {
    gen.current += 1; busy.current = false
    setState({ items: [], page: 0, totalPages: 1, loading: true, more: false, error: null })
    load(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const hasMore = state.page < state.totalPages
  const observer = useRef(null)
  // Attach to the element placed after the list: <div ref={sentinelRef} />
  const sentinelRef = useCallback((node) => {
    observer.current?.disconnect()
    if (!node || typeof IntersectionObserver === 'undefined') return
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !busy.current) load(state.page + 1, false)
    }, { rootMargin: '500px 0px' })
    observer.current.observe(node)
  }, [load, state.page, state.items.length])

  return { ...state, hasMore: hasMore && !state.error, sentinelRef, retry: () => load(state.page + 1, false) }
}
