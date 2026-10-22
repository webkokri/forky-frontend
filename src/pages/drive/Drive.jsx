import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { usePartner } from '../../context/PartnerAuth'
import { useLocation2 } from '../../context/LocationContext'
import { useAsync } from '../../utils/useAsync'
import { Shell } from '../Auth'
import PartnerLogin from '../PartnerLogin'
import TwoFactorSetup from '../../components/TwoFactorSetup'
import { Benefits, Field, PartnerHero, Stepper, Steps, field } from '../../components/PartnerKit'
import { Faq } from '../../components/PageRenderer'

export const toE164 = (v) => { const d = v.replace(/[^\d+]/g, ''); return d.startsWith('+') ? d : d.length === 10 ? `+1${d}` : d.length === 11 && d.startsWith('1') ? `+${d}` : d }
const VEHICLES = [['CAR', '🚗 Car'], ['E_BIKE', '⚡ E-bike'], ['BIKE', '🚲 Bike'], ['SCOOTER', '🛵 Scooter'], ['ON_FOOT', '🚶 On foot']]

export function DriveLanding() {
  const { data: faqs } = useAsync(() => api.listFaqs('DRIVER').catch(() => []), [])
  return (
    <div>
      <PartnerHero eyebrow="Drive with Forky" title="Earn on" accent="your own schedule." text="Deliver meals from local restaurants in your neighbourhood. Choose your hours, keep 100% of your tips and get paid every week." primary={{ to: '/drive/apply', label: 'Start your application' }} secondary={{ to: '/drive/login', label: 'Continue my application' }} emoji="🛵" />
      <div className="container-x space-y-14 py-14">
        <section><h2 className="mb-5 font-display text-3xl font-bold">Why drive with us</h2>
          <Benefits items={[['🕒', 'Total flexibility', 'Go online when it suits you. No minimum hours.'], ['💸', 'Keep your tips', '100% of customer tips go to you, paid out weekly or instantly.'], ['📍', 'Deliver locally', 'Short trips in your own neighbourhood.']]} /></section>
        <section><h2 className="mb-5 font-display text-3xl font-bold">How it works</h2>
          <Steps items={[['Apply', 'Tell us about you and your vehicle. It takes about 5 minutes.'], ['Verify', 'Confirm your phone and upload your documents.'], ['Learn', 'Finish a short training and quiz.'], ['Deliver', 'Once approved, go online and start earning.']]} /></section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card"><h3 className="font-display text-xl font-bold">What you’ll need</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">{['18 years or older', 'Eligible to work in Canada', 'A car, bike, e-bike, scooter — or your own two feet', 'Driver’s licence, registration and insurance if you drive', 'An Android or iOS smartphone'].map((r) => <li key={r} className="flex gap-2"><span className="text-brand-500">✓</span>{r}</li>)}</ul></div>
          <div className="rounded-2xl bg-ink-900 p-6 text-white"><h3 className="font-display text-xl font-bold">Ready to go?</h3><p className="mt-2 text-sm text-ink-300">Create your driver account now and finish onboarding at your own pace.</p><Link to="/drive/apply" className="btn-primary mt-5">Apply to drive →</Link></div>
        </section>
        {faqs?.length > 0 && <section><h2 className="mb-5 font-display text-3xl font-bold">Driver questions</h2><Faq items={faqs.map((f) => ({ q: f.question, a: f.answer }))} /></section>}
      </div>
    </div>
  )
}

export const DriveLogin = () => <PartnerLogin role="driver" title="Driver sign in" subtitle="Continue your Forky driver onboarding." to="/drive/onboarding" footer={<>New here? <Link to="/drive/apply" className="font-bold text-brand-600">Apply to drive</Link></>} />

export function DriveApply() {
  const { adopt, enable2fa } = usePartner('driver')
  const { cities, loc } = useLocation2()
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', language: 'en', cityId: '', vehicleType: 'CAR', vehicleMake: '', vehicleModel: '', vehicleColor: '', licensePlate: '', otpCode: '', agree: false })
  const [otp, setOtp] = useState({ sent: false, busy: false })
  const [setup, setSetup] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const motor = f.vehicleType !== 'ON_FOOT' && f.vehicleType !== 'BIKE'
  const cityId = f.cityId || cities.find((c) => c.name === loc?.city)?.id || cities[0]?.id || ''

  const next = (e) => { e.preventDefault(); setErr(''); setI((n) => n + 1) }
  const sendCode = async () => {
    setOtp({ sent: false, busy: true }); setErr('')
    try { await api.requestDriverOtp(toE164(f.phone)); setOtp({ sent: true, busy: false }) } catch (x) { setErr(x.message); setOtp({ sent: false, busy: false }) }
  }
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const body = { firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: toE164(f.phone), password: f.password, language: f.language, cityId, vehicleType: f.vehicleType, otpCode: f.otpCode.trim(), ...(f.vehicleMake && { vehicleMake: f.vehicleMake }), ...(f.vehicleModel && { vehicleModel: f.vehicleModel }), ...(f.vehicleColor && { vehicleColor: f.vehicleColor }), ...(motor && f.licensePlate && { licensePlate: f.licensePlate }) }
    try {
      const res = await api.registerDriver(body)
      if (res.requires2faSetup) setSetup(res.tempToken)
      else if (res.accessToken) { await adopt(res); nav('/drive/onboarding', { state: { verification: res.verification } }) } else nav('/drive/login')
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  if (setup) return <Shell title="Almost there" subtitle="Protect your driver account." footer=""><TwoFactorSetup tempToken={setup} onEnable={async (t, c) => { await enable2fa(t, c); nav('/drive/onboarding') }} /></Shell>
  return (
    <div className="bg-gradient-to-br from-[#eef0ff] to-[#ffe9e2] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-10">
        <h1 className="font-display text-3xl font-bold">Apply to drive</h1><p className="mt-1 text-sm text-ink-500">Already applied? <Link to="/drive/login" className="font-bold text-brand-600">Sign in</Link></p>
        <div className="mt-6"><Stepper steps={['Your details', 'Your vehicle', 'Verify phone']} index={i} /></div>
        {i === 0 && (
          <form onSubmit={next} className="grid gap-4 sm:grid-cols-2">
            <Field label="First name"><input required value={f.firstName} onChange={set('firstName')} className={field} /></Field>
            <Field label="Last name"><input required value={f.lastName} onChange={set('lastName')} className={field} /></Field>
            <Field label="Email"><input required type="email" value={f.email} onChange={set('email')} className={field} /></Field>
            <Field label="Mobile phone" hint="We’ll text you a code. e.g. 416 555 0100"><input required type="tel" value={f.phone} onChange={set('phone')} className={field} /></Field>
            <Field label="City you’ll drive in"><select required value={cityId} onChange={set('cityId')} className={field}>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}, {c.province}</option>)}</select></Field>
            <Field label="Password" hint="At least 8 characters"><input required minLength={8} type="password" autoComplete="new-password" value={f.password} onChange={set('password')} className={field} /></Field>
            <div className="sm:col-span-2"><button className="btn-primary w-full py-3">Continue →</button></div>
          </form>
        )}
        {i === 1 && (
          <form onSubmit={next} className="space-y-4">
            <div><div className="text-sm font-semibold">How will you deliver?</div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">{VEHICLES.map(([v, l]) => <button type="button" key={v} onClick={() => setF({ ...f, vehicleType: v })} className={`rounded-xl border p-3 text-sm font-semibold ${f.vehicleType === v ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>{l}</button>)}</div></div>
            {f.vehicleType !== 'ON_FOOT' && <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Make"><input value={f.vehicleMake} onChange={set('vehicleMake')} className={field} /></Field>
              <Field label="Model"><input value={f.vehicleModel} onChange={set('vehicleModel')} className={field} /></Field>
              <Field label="Colour"><input value={f.vehicleColor} onChange={set('vehicleColor')} className={field} /></Field>
              {motor && <Field label="Licence plate"><input value={f.licensePlate} onChange={set('licensePlate')} className={field} /></Field>}
            </div>}
            <div className="flex gap-3"><button type="button" onClick={() => setI(0)} className="btn-ghost">← Back</button><button className="btn-primary flex-1 py-3">Continue →</button></div>
          </form>
        )}
        {i === 2 && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-2xl bg-cream p-4 text-sm"><b>{f.firstName} {f.lastName}</b> · {f.email}<br />{toE164(f.phone)} · {VEHICLES.find(([v]) => v === f.vehicleType)?.[1]}</div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[10rem] flex-1"><Field label="6-digit code"><input required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={f.otpCode} onChange={set('otpCode')} className={`${field} tracking-[0.3em]`} /></Field></div>
              <button type="button" disabled={otp.busy} onClick={sendCode} className="btn-ghost">{otp.busy ? 'Sending…' : otp.sent ? 'Resend code' : 'Text me a code'}</button>
            </div>
            {otp.sent && <p className="text-xs text-mint-600">Code sent to {toE164(f.phone)}.</p>}
            <label className="flex items-start gap-2 text-sm text-ink-500"><input required type="checkbox" checked={f.agree} onChange={set('agree')} className="mt-1 accent-brand-500" />I agree to the <Link to="/terms-of-service" className="font-semibold text-brand-600">Terms</Link> and <Link to="/privacy-policy" className="font-semibold text-brand-600">Privacy Policy</Link>, and consent to identity and background checks.</label>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex gap-3"><button type="button" onClick={() => setI(1)} className="btn-ghost">← Back</button><button disabled={busy || !f.agree} className="btn-primary flex-1 py-3">{busy ? 'Submitting…' : 'Submit application'}</button></div>
          </form>
        )}
        {i < 2 && err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
      </div>
    </div>
  )
}
