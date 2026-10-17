import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

// Landing page after "Checkout" in the assistant for a guest: sign in, then the chat's cart is
// loaded into the customer's real cart (one-time token) and we continue to checkout.
export default function Handoff() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const { user, ready } = useAuth()
  const cart = useCart()
  const nav = useNavigate()
  const [state, setState] = useState({ status: 'working', skipped: [], error: '' })
  const ran = useRef(false)

  useEffect(() => {
    if (!ready || !user || !token || ran.current) return
    ran.current = true
    api.importHandoff(token)
      .then(async (r) => { await cart.restore().catch(() => {}); if (r.skipped?.length) setState({ status: 'partial', skipped: r.skipped, error: '', note: r.orderNote }); else nav('/cart', { replace: true }) })
      .catch((e) => setState({ status: 'error', skipped: [], error: e.message }))
  }, [ready, user, token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) return <Navigate to="/" replace />
  if (ready && !user) return <Navigate to={`/login?next=${encodeURIComponent(`/handoff?token=${token}`)}`} replace />
  return (
    <div className="container-x max-w-md py-20 text-center">
      {state.status === 'working' && <><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-500" /><p className="mt-5 font-semibold">Moving your order to the cart…</p></>}
      {state.status === 'error' && <><div className="text-5xl">😕</div><h1 className="mt-3 font-display text-2xl font-bold">We couldn’t load that order</h1><p className="mt-2 text-sm text-ink-500">{state.error}. The link may have expired or already been used.</p><Link to="/restaurants" className="btn-primary mt-6">Browse restaurants</Link></>}
      {state.status === 'partial' && (
        <><div className="text-5xl">🛒</div><h1 className="mt-3 font-display text-2xl font-bold">Your cart is ready</h1><p className="mt-2 text-sm text-ink-500">A few items couldn’t be added:</p>
          <ul className="mx-auto mt-3 max-w-xs space-y-1 text-left text-sm">{state.skipped.map((s) => <li key={s.name} className="rounded-lg bg-amber-50 px-3 py-2"><b>{s.name}</b> <span className="text-ink-500">· {s.reason}</span></li>)}</ul>
          <Link to="/cart" className="btn-primary mt-6">Continue to cart →</Link></>
      )}
    </div>
  )
}
