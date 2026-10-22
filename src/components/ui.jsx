import { useState } from 'react'
import { useCart } from '../context/CartContext'
import ModifierModal from './ModifierModal'

export function Thumb({ emoji, bg, src, className = '', size = 'text-5xl' }) {
  if (src) return <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />
  return (
    <div className={`flex items-center justify-center overflow-hidden ${className}`} style={{ background: `radial-gradient(circle at 30% 25%, #ffffffaa, transparent 60%), ${bg}` }}>
      <span className={`${size} drop-shadow-sm select-none`} aria-hidden>{emoji}</span>
    </div>
  )
}

export function Rating({ value, count, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${className}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] text-white ${value == null ? 'bg-brand-500' : 'bg-mint-500'}`}>★</span>
      {value == null ? 'New' : Number(value).toFixed(1)}
      {count != null && <span className="font-normal text-ink-500">({count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count})</span>}
    </span>
  )
}

export function VegMark({ veg }) {
  return (
    <span title={veg ? 'Vegetarian' : 'Non-vegetarian'} className={`inline-grid h-4 w-4 place-items-center rounded-sm border-2 ${veg ? 'border-mint-600' : 'border-rose-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${veg ? 'bg-mint-600' : 'bg-rose-600'}`} />
    </span>
  )
}

export function AddButton({ vendor, item, disabled, compact }) {
  const cart = useCart()
  const [picking, setPicking] = useState(false)
  const hasOptions = item.modifierGroups?.length > 0
  const qty = cart.qtyOf(item.id)
  const max = item.maxQuantity || vendor.maxQty || 99
  const base = compact ? 'h-8 min-w-[72px] text-xs' : 'h-9 min-w-[96px] text-sm'
  if (disabled) return <span className={`${base} inline-grid place-items-center rounded-lg bg-ink-100 px-3 font-semibold text-ink-500`}>{item.inStock === false ? 'Out of stock' : 'Unavailable'}</span>
  if (hasOptions) {
    return (
      <>
        <button onClick={() => setPicking(true)} className={`${base} rounded-lg border border-brand-500 bg-white px-3 font-bold text-brand-600 shadow-sm transition hover:bg-brand-50`}>
          {qty ? `ADD + (${qty})` : 'ADD +'}
        </button>
        {picking && <ModifierModal item={item} onClose={() => setPicking(false)} onAdd={(line) => { cart.add(vendor, line); setPicking(false) }} />}
      </>
    )
  }
  if (!qty) {
    return (
      <button onClick={() => cart.add(vendor, item)} className={`${base} rounded-lg border border-brand-500 bg-white px-3 font-bold text-brand-600 shadow-sm transition hover:bg-brand-50`}>
        ADD
      </button>
    )
  }
  return (
    <div className={`${base} inline-flex items-center justify-between rounded-lg bg-brand-500 px-1 font-bold text-white shadow-sm`}>
      <button aria-label="Remove one" onClick={() => cart.remove(item.id)} className="h-full px-2">−</button>
      <span>{qty}</span>
      <button aria-label="Add one" disabled={qty >= max} onClick={() => cart.add(vendor, item)} className="h-full px-2 disabled:opacity-40">+</button>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-ink-100 ${className}`} />
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight sm:text-3xl"><span aria-hidden className="h-6 w-1.5 rounded-full bg-gradient-to-b from-brand-500 to-violet-500" />{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ error }) {
  return (
    <div className="container-x py-20 text-center">
      <div className="text-5xl">🍽️</div>
      <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
      <p className="mt-2 text-ink-500">{error?.message}</p>
    </div>
  )
}
