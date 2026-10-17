import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useAsync } from '../utils/useAsync'
import { Skeleton } from './ui'

const NAV = [
  ['/account', '🏠', 'Dashboard', true],
  ['/account/orders', '📦', 'Orders'],
  ['/cart', '🛍️', 'My cart'],
  ['/account/addresses', '📍', 'Addresses'],
  ['/account/payments', '💳', 'Payments & wallet'],
  ['/account/favorites', '❤️', 'Favourites'],
  ['/account/notifications', '🔔', 'Notifications'],
  ['/account/support', '💬', 'Help & support'],
  ['/account/profile', '👤', 'Profile & security'],
]

// Guard + shell for every signed-in customer page.
export default function AccountLayout() {
  const { user, ready, logout } = useAuth()
  const { count } = useCart()
  const { pathname } = useLocation()
  const { data: unread } = useAsync(() => (user ? api.unreadCount().catch(() => null) : Promise.resolve(null)), [user?.id, pathname])
  if (!ready) return <div className="container-x py-12"><Skeleton className="h-64" /></div>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
  const badge = (to) => (to === '/cart' ? count : to === '/account/notifications' ? unread?.count ?? unread?.unread : 0)

  return (
    <div className="container-x grid grid-cols-[minmax(0,1fr)] gap-6 py-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:py-8">
      <aside className="min-w-0">
        <div className="mb-4 hidden items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card lg:flex">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-xl font-bold text-white">{(user.firstName || '?')[0]}</div>
          <div className="min-w-0"><div className="truncate font-bold">{user.name}</div><div className="truncate text-xs text-ink-500">{user.email}</div></div>
        </div>
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {NAV.map(([to, icon, label, end]) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-brand-500 text-white shadow' : 'text-ink-700 hover:bg-brand-50'}`}>
              <span aria-hidden>{icon}</span><span className="flex-1 whitespace-nowrap">{label}</span>
              {badge(to) > 0 && <span className="rounded-full bg-white/90 px-2 text-xs font-bold text-brand-600 ring-1 ring-brand-200">{badge(to)}</span>}
            </NavLink>
          ))}
          <button onClick={logout} className="hidden items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 lg:flex"><span aria-hidden>↩</span>Sign out</button>
        </nav>
      </aside>
      <div className="min-w-0"><Outlet /></div>
    </div>
  )
}

export const PageHead = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}</div>
    {action}
  </div>
)
export const Card = ({ className = '', children }) => <div className={`rounded-2xl border border-ink-100 bg-white p-5 shadow-card ${className}`}>{children}</div>
export const Empty = ({ icon = '📭', title, text, action }) => (
  <div className="rounded-2xl border border-dashed border-ink-300 p-12 text-center"><div className="text-5xl">{icon}</div><h3 className="mt-3 font-display text-xl font-bold">{title}</h3>{text && <p className="mt-1 text-sm text-ink-500">{text}</p>}{action && <div className="mt-5">{action}</div>}</div>
)
