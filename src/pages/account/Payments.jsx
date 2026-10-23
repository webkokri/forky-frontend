import { useRef, useState } from 'react'
import { api } from '../../api'
import { useAsync, money } from '../../utils/useAsync'
import { Card, Empty, PageHead } from '../../components/AccountLayout'
import StripeElement from '../../components/StripeElement'
import { when } from '../../utils/orders'

export default function Payments() {
  const { data: wallet, reload: reloadWallet } = useAsync(() => api.getWallet(), [])
  const { data: cards, reload: reloadCards } = useAsync(() => api.listCards().catch(() => ({ data: [] })), [])
  const { data: cfg } = useAsync(() => api.getPaymentsConfig(), [])
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState(25)
  const [msg, setMsg] = useState(null) // { ok, text }
  const [flow, setFlow] = useState(null) // { kind: 'topup' | 'card', clientSecret, publishableKey, intentId, amount }
  const [busy, setBusy] = useState(false)
  const el = useRef(null)

  const run = async (fn, okText) => {
    setMsg(null)
    try { const r = await fn(); setMsg({ ok: true, text: typeof okText === 'function' ? okText(r) : okText }) } catch (e) { setMsg({ ok: false, text: e.message }) }
  }
  const cardsReady = cfg?.provider === 'stripe' && !!cfg?.publishableKey
  const unavailable = 'Card payments aren’t available right now.'
  const start = (kind, make) => async () => {
    setMsg(null)
    if (!cardsReady) return setMsg({ ok: false, text: unavailable })
    try { const r = await make(); setFlow({ kind, publishableKey: r.publishableKey || cfg.publishableKey, clientSecret: r.clientSecret, intentId: r.intentId, amount: r.amount }) } catch (e) { setMsg({ ok: false, text: e.message }) }
  }
  const finish = async () => {
    setBusy(true); setMsg(null)
    try {
      const r = await el.current.confirm(flow.kind === 'card' ? 'setup' : 'payment', `${window.location.origin}/account/payments`)
      if (r.error) throw new Error(r.error.message || 'That didn’t go through.')
      if (flow.kind === 'topup') { const c = await api.topUpConfirm(r.paymentIntent?.id || flow.intentId); setMsg({ ok: true, text: c.status === 'not_paid' ? 'We haven’t received the payment yet. Your balance will update shortly.' : `${money(c.amount ?? flow.amount)} added to your wallet.` }); reloadWallet() } else { setMsg({ ok: true, text: 'Card saved.' }); reloadCards() }
      setFlow(null)
    } catch (e) { setMsg({ ok: false, text: e.message }) } finally { setBusy(false) }
  }
  const txs = wallet?.transactions?.data || []
  const methods = [['💳', 'Credit / debit card', cardsReady], ['', 'Apple Pay', cardsReady && cfg?.applePay !== false], ['', 'Google Pay', cardsReady && cfg?.googlePay !== false], ['👛', 'Forky wallet', cfg?.walletEnabled !== false]]

  return (
    <div className="space-y-6">
      <PageHead title="Payments & wallet" subtitle="Manage how you pay on Forky." />
      {msg && <p className={`rounded-xl p-3 text-sm font-semibold ${msg.ok ? 'bg-mint-500/10 text-mint-600' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}

      <Card className="bg-gradient-to-br from-brand-600 to-flame-700 !border-0 text-white">
        <div className="text-xs font-bold uppercase tracking-wider text-white/80">Wallet balance</div>
        <div className="mt-1 font-display text-5xl font-bold">{wallet ? money(wallet.balance) : '–'}</div>
        <form onSubmit={(e) => { e.preventDefault(); start('topup', () => api.topUpIntent(Number(amount)))() }} className="mt-5 flex flex-wrap items-center gap-2">
          {[10, 25, 50, 100].map((a) => <button type="button" key={a} onClick={() => setAmount(a)} className={`rounded-full border px-4 py-1.5 text-sm font-bold ${Number(amount) === a ? 'border-white bg-white text-brand-600' : 'border-white/40'}`}>${a}</button>)}
          <button className="rounded-full bg-white px-5 py-1.5 text-sm font-bold text-brand-600">Add funds</button>
        </form>
      </Card>

      {flow && (
        <Card>
          <div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">{flow.kind === 'card' ? 'Add a card' : `Add ${money(flow.amount ?? amount)} to your wallet`}</h2><button onClick={() => setFlow(null)} className="text-sm font-semibold text-ink-500 hover:text-ink-900">Cancel</button></div>
          <div className="mt-4"><StripeElement ref={el} key={flow.clientSecret} publishableKey={flow.publishableKey} clientSecret={flow.clientSecret} /></div>
          <button onClick={finish} disabled={busy} className="btn-primary mt-4 w-full py-3">{busy ? 'Processing…' : flow.kind === 'card' ? 'Save card' : `Pay ${money(flow.amount ?? amount)}`}</button>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-xl font-bold">Saved cards</h2>
          <div className="mt-4 space-y-3">
            {(cards?.data || []).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm">
                <div><b className="uppercase">{c.brand}</b> •••• {c.last4}<div className="text-xs text-ink-500">Expires {String(c.expMonth).padStart(2, '0')}/{c.expYear}{c.isDefault && ' · Default'}</div></div>
                <div className="flex gap-3 text-xs font-bold">
                  {!c.isDefault && <button onClick={() => run(async () => { await api.setDefaultCard(c.id); reloadCards() }, 'Default card updated')} className="text-brand-600">Make default</button>}
                  <button onClick={() => window.confirm('Remove this card?') && run(async () => { await api.deleteCard(c.id); reloadCards() }, 'Card removed')} className="text-rose-600">Remove</button>
                </div>
              </div>
            ))}
            {cards && !cards.data.length && <Empty icon="💳" title="No saved cards" />}
          </div>
          <button onClick={start('card', () => api.cardSetupIntent())} className="btn-ghost mt-4 w-full">+ Add a card</button>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-xl font-bold">Available at checkout</h2>
            <ul className="mt-3 space-y-2 text-sm">{methods.map(([i, l, ok]) => <li key={l} className="flex items-center justify-between rounded-xl border border-ink-100 p-3"><span>{i} {l}</span><span className={`text-xs font-bold ${ok ? 'text-mint-600' : 'text-ink-300'}`}>{ok ? 'Available' : 'Not yet available'}</span></li>)}</ul>
            <p className="mt-2 text-xs text-ink-500">Cash on delivery isn’t accepted.</p>
          </Card>
          {cfg?.giftCardsEnabled !== false && (
            <Card>
              <h2 className="font-display text-xl font-bold">Redeem a gift card</h2>
              <form onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await api.redeemGiftCard(code.trim()); setCode(''); reloadWallet(); return r }, (r) => `${money(r.amount)} added. New balance ${money(r.balance)}`) }} className="mt-3 flex gap-2">
                <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Gift card code" className="h-11 flex-1 rounded-xl border border-ink-100 px-3 text-sm uppercase outline-none focus:border-brand-500" /><button className="btn-primary">Redeem</button>
              </form>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <h2 className="font-display text-xl font-bold">Wallet activity</h2>
        {txs.length ? <ul className="mt-3 divide-y divide-ink-100">{txs.map((t) => (
          <li key={t.id} className="flex items-center justify-between py-3 text-sm"><div><div className="font-semibold">{t.description || t.reason || t.type?.replace(/_/g, ' ')}</div><div className="text-xs text-ink-500">{when(t.createdAt)}</div></div><b className={t.amount >= 0 ? 'text-mint-600' : 'text-ink-900'}>{t.amount >= 0 ? '+' : '−'}{money(Math.abs(t.amount))}</b></li>))}</ul> : <p className="mt-3 text-sm text-ink-500">No wallet activity yet.</p>}
      </Card>
    </div>
  )
}
