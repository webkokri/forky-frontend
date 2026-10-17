import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { usePartner } from '../context/PartnerAuth'
import { Shell } from './Auth'
import TwoFactorSetup from '../components/TwoFactorSetup'
import { Field, field } from '../components/PartnerKit'

// Sign-in for the partner apps (driver / restaurant), including 2FA code + first-time 2FA setup.
export default function PartnerLogin({ role, title, subtitle, to, footer }) {
  const { login, verify2fa, enable2fa, user } = usePartner(role)
  const nav = useNavigate()
  const [f, setF] = useState({ identifier: '', password: '' })
  const [step, setStep] = useState(null) // { kind: '2fa' | '2fa-setup', tempToken }
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (user && !step) return <Navigate to={to} replace />

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { const r = await login(f.identifier.trim(), f.password); if (r.step === 'done') nav(to); else setStep({ kind: r.step, tempToken: r.tempToken }) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const submit2fa = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await verify2fa(step.tempToken, code.trim()); nav(to) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  if (step?.kind === '2fa-setup') return <Shell title={title} subtitle="One more step." footer=""><TwoFactorSetup tempToken={step.tempToken} onEnable={async (t, c) => { await enable2fa(t, c); nav(to) }} onBack={() => setStep(null)} /></Shell>
  if (step) return (
    <Shell title="Two-step verification" subtitle="Enter the code from your authenticator app." footer="">
      <form onSubmit={submit2fa} className="space-y-4"><input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} className={`${field} text-center text-2xl tracking-[0.4em]`} />{err && <p className="text-sm text-rose-600">{err}</p>}<button disabled={busy || code.length < 6} className="btn-primary w-full py-3">Verify & sign in</button></form>
    </Shell>
  )
  return (
    <Shell title={title} subtitle={subtitle} footer={footer}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email or phone"><input required autoFocus autoComplete="username" value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} className={field} /></Field>
        <Field label="Password"><input required type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className={field} /></Field>
        {err && <p className="text-sm text-rose-600">{err}</p>}
        <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </Shell>
  )
}
