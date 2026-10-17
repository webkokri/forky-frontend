import { useEffect, useState } from 'react'
import { api } from '../api'

// Shown the first time an account that must use two-factor sign-in logs in.
// `onEnable(tempToken, code)` should finish the sign-in (enable2fa from the session context).
export default function TwoFactorSetup({ tempToken, onEnable, onBack }) {
  const [setup, setSetup] = useState(null)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { api.setup2fa(tempToken).then(setSetup).catch((e) => setErr(e.message)) }, [tempToken])

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await onEnable(tempToken, code.trim()) } catch (x) { setErr(x.message); setBusy(false) }
  }
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Secure your account</h2>
      <p className="mt-1 text-sm text-ink-500">Two-step sign-in is required. Scan this QR code with an authenticator app (Google Authenticator, 1Password, Authy…), then enter the 6-digit code.</p>
      <div className="mt-4 grid place-items-center rounded-2xl bg-cream p-4">
        {setup?.qrCode?.startsWith('data:image/') ? <img src={setup.qrCode} alt="Authenticator QR code" className="h-44 w-44" /> : <div className="h-44 w-44 animate-pulse rounded-xl bg-ink-100" />}
        {setup?.secret && <p className="mt-3 text-center text-xs text-ink-500">Can’t scan? Enter this key:<br /><code className="select-all font-bold tracking-widest text-ink-900">{setup.secret}</code></p>}
      </div>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="w-full rounded-xl border border-ink-100 px-4 py-2.5 text-center text-2xl tracking-[0.4em] outline-none focus:border-brand-500" />
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy || code.length < 6 || !setup} className="btn-primary w-full py-3">{busy ? 'Verifying…' : 'Turn on & continue'}</button>
        {onBack && <button type="button" onClick={onBack} className="w-full text-sm font-semibold text-brand-600">← Back</button>}
      </form>
    </div>
  )
}
