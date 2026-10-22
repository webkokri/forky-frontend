import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

const field = 'mt-1 w-full rounded-xl border border-ink-100 bg-white px-4 py-2.5 outline-none focus:border-brand-500'

export function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-gradient-to-br from-[#eef0ff] to-[#ffe9e2] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-ink-100 bg-white p-8 shadow-card">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-center text-sm text-ink-500">{footer}</p>
      </div>
    </div>
  )
}

export function Login() {
  const { login, verify2fa } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const [f, setF] = useState({ identifier: '', password: '' })
  const [temp, setTemp] = useState(null)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const run = (fn) => async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await fn(); nav(next, { replace: true }) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const submit = run(async () => {
    const r = await login(f.identifier.trim(), f.password)
    if (r.step === '2fa') { setTemp(r.tempToken); throw new Error('') }
  })
  const submit2fa = run(() => verify2fa(temp, code.trim()))

  if (temp) {
    return (
      <Shell title="Two-step verification" subtitle="Enter the 6-digit code from your authenticator app." footer={<button onClick={() => { setTemp(null); setCode('') }} className="font-bold text-brand-600">← Back</button>}>
        <form onSubmit={submit2fa} className="space-y-4">
          <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className={`${field} text-center text-2xl tracking-[0.4em]`} />
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button disabled={busy || code.length < 6} className="btn-primary w-full py-3">{busy ? 'Verifying…' : 'Verify & sign in'}</button>
        </form>
      </Shell>
    )
  }
  return (
    <Shell title="Welcome back" subtitle="Sign in to order and track your food." footer={<>New to Forky? <Link to={`/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-bold text-brand-600">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">Email or phone<input required autoFocus value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} autoComplete="username" className={field} /></label>
        <label className="block text-sm font-semibold">Password<input required type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" className={field} /></label>
        <div className="text-right text-sm"><Link to="/forgot-password" className="font-semibold text-brand-600">Forgot password?</Link></div>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </Shell>
  )
}

export function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', marketingEmailConsent: false })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const body = { ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim() }
      if (!body.phone.trim()) delete body.phone
      const res = await register(body)
      nav(res.accessToken ? next : `/login?next=${encodeURIComponent(next)}`, { replace: true })
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Shell title="Create your account" subtitle="Order from local restaurants in minutes." footer={<>Already have an account? <Link to="/login" className="font-bold text-brand-600">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold">First name<input required value={f.firstName} onChange={set('firstName')} className={field} /></label>
          <label className="block text-sm font-semibold">Last name<input required value={f.lastName} onChange={set('lastName')} className={field} /></label>
        </div>
        <label className="block text-sm font-semibold">Email<input required type="email" value={f.email} onChange={set('email')} className={field} /></label>
        <label className="block text-sm font-semibold">Phone <span className="font-normal text-ink-500">(optional)</span><input type="tel" value={f.phone} onChange={set('phone')} className={field} /></label>
        <label className="block text-sm font-semibold">Password<input required minLength={8} type="password" value={f.password} onChange={set('password')} autoComplete="new-password" className={field} /></label>
        <label className="flex items-start gap-2 text-sm text-ink-500"><input type="checkbox" checked={f.marketingEmailConsent} onChange={set('marketingEmailConsent')} className="mt-1 accent-brand-500" />Send me offers and updates by email</label>
        <p className="text-xs text-ink-500">By creating an account you agree to our <Link to="/terms-of-service" className="font-semibold text-brand-600">Terms</Link> and <Link to="/privacy-policy" className="font-semibold text-brand-600">Privacy Policy</Link>.</p>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </Shell>
  )
}

export function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await api.forgotPassword(identifier.trim()); setSent(true) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Shell title="Reset your password" subtitle="We’ll send a code to your email or phone." footer={<Link to="/login" className="font-bold text-brand-600">← Back to sign in</Link>}>
      {sent ? (
        <div className="text-center"><div className="text-4xl">📬</div><p className="mt-3 text-sm text-ink-500">If an account exists for <b>{identifier}</b>, a reset code is on its way.</p><Link to={`/reset-password?identifier=${encodeURIComponent(identifier)}`} className="btn-primary mt-5 w-full">I have a code</Link></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">Email or phone<input required autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={field} /></label>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Sending…' : 'Send reset code'}</button>
        </form>
      )}
    </Shell>
  )
}

export function ResetPassword() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState({ identifier: params.get('identifier') || '', code: '', newPassword: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await api.resetPassword({ ...f, identifier: f.identifier.trim(), code: f.code.trim() }); nav('/login', { replace: true }) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <Shell title="Choose a new password" subtitle="Enter the code we sent you." footer={<Link to="/login" className="font-bold text-brand-600">← Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold">Email or phone<input required value={f.identifier} onChange={set('identifier')} className={field} /></label>
        <label className="block text-sm font-semibold">Code<input required inputMode="numeric" autoComplete="one-time-code" value={f.code} onChange={set('code')} className={field} /></label>
        <label className="block text-sm font-semibold">New password<input required minLength={8} type="password" autoComplete="new-password" value={f.newPassword} onChange={set('newPassword')} className={field} /></label>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Saving…' : 'Update password'}</button>
      </form>
    </Shell>
  )
}
