import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

// Stripe Payment Element (card, Apple Pay, Google Pay). Card details never touch our server.
// ref.confirm('payment' | 'setup') -> { error?, paymentIntent?, setupIntent? }
const cache = {}
const getStripe = (pk) => (cache[pk] ??= loadStripe(pk))

/** Pay a PaymentIntent with a card the customer saved earlier (no card details are typed; Stripe handles 3-D Secure) -> { error?, paymentIntent? } */
export async function confirmSavedCard(publishableKey, clientSecret, paymentMethodId) {
  const stripe = await getStripe(publishableKey)
  if (!stripe) return { error: { message: 'The payment form couldn’t be loaded. Check your connection and try again.' } }
  return stripe.confirmCardPayment(clientSecret, { payment_method: paymentMethodId })
}

export default forwardRef(function StripeElement({ publishableKey, clientSecret }, ref) {
  const host = useRef(null)
  const state = useRef({})
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true, el
    setReady(false); setErr('')
    getStripe(publishableKey).then((stripe) => {
      if (!alive || !stripe || !host.current) return
      const elements = stripe.elements({ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#ee5034', colorText: '#1c1a3a', borderRadius: '12px', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' } } })
      el = elements.create('payment', { layout: 'tabs' })
      el.on('ready', () => alive && setReady(true))
      el.mount(host.current)
      state.current = { stripe, elements }
    }).catch(() => alive && setErr('Couldn’t load the secure card form. Check your connection and try again.'))
    return () => { alive = false; el?.destroy?.() }
  }, [publishableKey, clientSecret])

  useImperativeHandle(ref, () => ({
    async confirm(kind, returnUrl = `${window.location.origin}/cart`) {
      const { stripe, elements } = state.current
      if (!stripe) return { error: { message: 'The card form isn’t ready yet.' } }
      const fn = kind === 'setup' ? stripe.confirmSetup : stripe.confirmPayment
      return fn.call(stripe, { elements, redirect: 'if_required', confirmParams: { return_url: returnUrl } })
    },
  }), [])

  return (
    <div>
      {!ready && !err && <div className="h-28 animate-pulse rounded-xl bg-ink-100" aria-label="Loading card form" />}
      {err && <p className="text-sm text-rose-600">{err}</p>}
      <div ref={host} className={ready ? '' : 'h-0 overflow-hidden'} />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500"><span aria-hidden>🔒</span>Payments are processed securely by Stripe.</p>
    </div>
  )
})
