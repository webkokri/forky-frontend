import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { money } from '../utils/useAsync'

// Floating bar shown on vendor pages once something is in the cart.
export default function CartBar() {
  const { count, subtotal, vendor } = useCart()
  const { pathname } = useLocation()
  if (!count || ['/cart', '/order', '/account', '/drive', '/business', '/login', '/register'].some((p) => pathname.startsWith(p))) return null
  const vendorPage = pathname.startsWith('/restaurant') || pathname.startsWith('/store')
  return (
    <div className={`fixed inset-x-0 bottom-4 z-30 px-4 ${vendorPage ? 'lg:hidden' : ''}`}>
      <Link to="/cart" className="mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-gradient-to-r from-ink-900 to-violet-900 px-5 py-3.5 text-white shadow-2xl shadow-violet-900/40 ring-1 ring-white/10 transition hover:brightness-110">
        <div>
          <div className="text-sm font-bold">{count} item{count > 1 ? 's' : ''} · {money(subtotal)}</div>
          <div className="text-xs text-white/70">from {vendor?.name}</div>
        </div>
        <span className="text-sm font-extrabold">View cart →</span>
      </Link>
    </div>
  )
}
