import { useCart } from '../context/CartContext'

export default function ReplaceCartModal() {
  const { pending, vendor, confirmReplace, cancelReplace } = useCart()
  if (!pending) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" onClick={cancelReplace}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-extrabold">Start a new cart?</h3>
        <p className="mt-2 text-sm text-ink-500">
          Your cart has items from <b>{vendor?.name}</b>. Adding this will clear them and start a cart from <b>{pending.vendor.name}</b>.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={cancelReplace}>Keep current</button>
          <button className="btn-primary" onClick={confirmReplace}>Start fresh</button>
        </div>
      </div>
    </div>
  )
}
