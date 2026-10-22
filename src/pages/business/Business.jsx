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
import { toE164 } from '../drive/Drive'
import AddressSearch from '../../components/AddressSearch'

const TYPES = [['RESTAURANT', '🍽️', 'Restaurant'], ['CAFE', '☕', 'Cafe'], ['BAKERY', '🥐', 'Bakery'], ['GROCERY', '🛒', 'Grocery store'], ['CONVENIENCE', '🏪', 'Convenience store'], ['SPECIALTY', '🥩', 'Specialty food store']]

export function BusinessLanding() {
  const { data: faqs } = useAsync(() => api.listFaqs('RESTAURANT').catch(() => []), [])
  return (
    <div>
      <PartnerHero eyebrow="Forky for business" title="Reach more customers," accent="right where you are." text="List your restaurant, cafe, bakery or grocery store on Forky. We bring the orders and the couriers; you keep doing what you do best." primary={{ to: '/business/apply', label: 'Apply now' }} secondary={{ to: '/business/login', label: 'Continue my application' }} emoji="🏪" />
      <div className="container-x space-y-14 py-14">
        <section><h2 className="mb-5 font-display text-3xl font-bold">Why partner with Forky</h2>
          <Benefits items={[['📈', 'New customers', 'Get discovered by hungry people near you.'], ['🛵', 'Delivery handled', 'Use our couriers, your own staff, or offer pickup only.'], ['🧾', 'Simple payouts', 'Clear commissions and regular payouts, with statements.']]} /></section>
        <section><h2 className="mb-5 font-display text-3xl font-bold">How onboarding works</h2>
          <Steps items={[['Apply', 'Tell us about your business and create your owner account.'], ['Verify', 'Upload your licence, health certificate and a void cheque.'], ['Set up', 'Add your menu and opening hours with our team’s help.'], ['Go live', 'Complete a test order and start taking real ones.']]} /></section>
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card"><h3 className="font-display text-xl font-bold">Have these ready</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">{['Business name and address', 'Valid business licence', 'Health / food-handler certificate', 'Void cheque or bank letter for payouts', 'Your menu or product list'].map((r) => <li key={r} className="flex gap-2"><span className="text-brand-500">✓</span>{r}</li>)}</ul></div>
          <div className="rounded-2xl bg-ink-900 p-6 text-white"><h3 className="font-display text-xl font-bold">Takes about 10 minutes</h3><p className="mt-2 text-sm text-ink-300">Start your application now and finish your documents whenever you’re ready.</p><Link to="/business/apply" className="btn-primary mt-5">Start application →</Link></div>
        </section>
        {faqs?.length > 0 && <section><h2 className="mb-5 font-display text-3xl font-bold">Partner questions</h2><Faq items={faqs.map((f) => ({ q: f.question, a: f.answer }))} /></section>}
      </div>
    </div>
  )
}

export const BusinessLogin = () => <PartnerLogin role="restaurant" title="Business sign in" subtitle="Continue your onboarding or check your application." to="/business/onboarding" footer={<>New to Forky? <Link to="/business/apply" className="font-bold text-brand-600">Apply now</Link></>} />

export function BusinessApply() {
  const { enable2fa } = usePartner('restaurant')
  const { cities, loc } = useLocation2()
  const { data: cuisines } = useAsync(() => api.listAllCuisines().catch(() => []), [])
  const nav = useNavigate()
  const [i, setI] = useState(0)
  const [f, setF] = useState({ storeType: 'RESTAURANT', restaurantName: '', businessName: '', hstNumber: '', description: '', addressLine1: '', addressLine2: '', cityId: '', postalCode: '', province: 'ON', phone: '', email: '', cuisineIds: [], pickupEnabled: true, deliveryEnabled: true, ownerFirstName: '', ownerLastName: '', password: '', agree: false, lat: null, lng: null })
  const [setup, setSetup] = useState(null)
  const [verification, setVerification] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const cityId = f.cityId || cities.find((c) => c.name === loc?.city)?.id || cities[0]?.id || ''
  const city = cities.find((c) => c.id === cityId)
  const next = (e) => { e.preventDefault(); setErr(''); if (i === 2 && !f.pickupEnabled && !f.deliveryEnabled) return setErr('Choose pickup, delivery or both.'); setI((n) => n + 1) }
  const toggleCuisine = (id) => setF({ ...f, cuisineIds: f.cuisineIds.includes(id) ? f.cuisineIds.filter((x) => x !== id) : [...f.cuisineIds, id].slice(0, 5) })

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const body = { businessName: f.businessName.trim(), restaurantName: f.restaurantName.trim(), storeType: f.storeType, addressLine1: f.addressLine1.trim(), ...(f.addressLine2 && { addressLine2: f.addressLine2 }), city: city?.name || '', cityId, province: f.province, postalCode: f.postalCode.trim(), phone: toE164(f.phone), email: f.email.trim(), ownerFirstName: f.ownerFirstName.trim(), ownerLastName: f.ownerLastName.trim(), password: f.password, pickupEnabled: f.pickupEnabled, deliveryEnabled: f.deliveryEnabled, ...(f.description && { description: f.description }), ...(f.hstNumber && { hstNumber: f.hstNumber }), ...(f.cuisineIds.length && { cuisineIds: f.cuisineIds }), ...(f.lat != null && { lat: f.lat, lng: f.lng }) }
    try {
      const res = await api.applyBusiness(body)
      setVerification(res.verification)
      if (res.requires2faSetup) setSetup(res.tempToken)
      else nav('/business/login')
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }

  if (setup) return <Shell title="Application received 🎉" subtitle="Secure your owner account to continue." footer=""><TwoFactorSetup tempToken={setup} onEnable={async (t, c) => { await enable2fa(t, c); nav('/business/onboarding', { state: { verification } }) }} /></Shell>
  return (
    <div className="bg-gradient-to-br from-[#eef0ff] to-[#ffe9e2] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-10">
        <h1 className="font-display text-3xl font-bold">Partner application</h1><p className="mt-1 text-sm text-ink-500">Already applied? <Link to="/business/login" className="font-bold text-brand-600">Sign in</Link></p>
        <div className="mt-6"><Stepper steps={['Business', 'Location', 'Service', 'Owner']} index={i} /></div>
        {i === 0 && (
          <form onSubmit={next} className="space-y-4">
            <div><div className="text-sm font-semibold">What kind of business is it?</div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{TYPES.map(([v, e, l]) => <button type="button" key={v} onClick={() => setF({ ...f, storeType: v })} className={`rounded-xl border p-3 text-sm font-semibold ${f.storeType === v ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}>{e} {l}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name customers will see"><input required value={f.restaurantName} onChange={set('restaurantName')} className={field} /></Field>
              <Field label="Legal business name"><input required value={f.businessName} onChange={set('businessName')} className={field} /></Field>
              <Field label="HST number" hint="Optional"><input value={f.hstNumber} onChange={set('hstNumber')} className={field} /></Field>
            </div>
            <Field label="Short description" hint="Optional. Shown on your page."><textarea rows={3} maxLength={500} value={f.description} onChange={set('description')} className={field} /></Field>
            <button className="btn-primary w-full py-3">Continue →</button>
          </form>
        )}
        {i === 1 && (
          <form onSubmit={next} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><AddressSearch near={city && { lat: city.centerLat, lng: city.centerLng }} onPick={(p) => setF((x) => ({ ...x, addressLine1: p.line1, postalCode: p.postalCode || x.postalCode, province: p.province || x.province, lat: p.lat, lng: p.lng }))} placeholder="Search your business address (puts you on the map)" /></div>
            <div className="sm:col-span-2"><Field label="Street address"><input required value={f.addressLine1} onChange={set('addressLine1')} className={field} /></Field></div>
            <Field label="Unit / suite"><input value={f.addressLine2} onChange={set('addressLine2')} className={field} /></Field>
            <Field label="City"><select required value={cityId} onChange={set('cityId')} className={field}>{cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Province"><input value={f.province} onChange={set('province')} className={field} /></Field>
            <Field label="Postal code"><input required value={f.postalCode} onChange={set('postalCode')} className={field} /></Field>
            <Field label="Business phone"><input required type="tel" value={f.phone} onChange={set('phone')} className={field} /></Field>
            <Field label="Business email"><input required type="email" value={f.email} onChange={set('email')} className={field} /></Field>
            <div className="flex gap-3 sm:col-span-2"><button type="button" onClick={() => setI(0)} className="btn-ghost">← Back</button><button className="btn-primary flex-1 py-3">Continue →</button></div>
          </form>
        )}
        {i === 2 && (
          <form onSubmit={next} className="space-y-5">
            <div><div className="text-sm font-semibold">How will customers get their order?</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{[['pickupEnabled', '🛍️ Pickup'], ['deliveryEnabled', '🛵 Delivery']].map(([k, l]) => <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${f[k] ? 'border-brand-500 bg-brand-50' : 'border-ink-100'}`}><input type="checkbox" checked={f[k]} onChange={set(k)} className="accent-brand-500" />{l}</label>)}</div></div>
            <div><div className="text-sm font-semibold">Cuisines or categories <span className="font-normal text-ink-500">(up to 5)</span></div>
              <div className="mt-2 flex flex-wrap gap-2">{(cuisines || []).map((c) => <button type="button" key={c.id} onClick={() => toggleCuisine(c.id)} className={`chip ${f.cuisineIds.includes(c.id) ? 'chip-active' : ''}`}>{c.name}</button>)}</div></div>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex gap-3"><button type="button" onClick={() => setI(1)} className="btn-ghost">← Back</button><button className="btn-primary flex-1 py-3">Continue →</button></div>
          </form>
        )}
        {i === 3 && (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-ink-500">Create the owner account you’ll use to manage {f.restaurantName || 'your business'}.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Owner first name"><input required value={f.ownerFirstName} onChange={set('ownerFirstName')} className={field} /></Field>
              <Field label="Owner last name"><input required value={f.ownerLastName} onChange={set('ownerLastName')} className={field} /></Field>
              <div className="sm:col-span-2"><Field label="Password" hint="At least 8 characters. You sign in with your business email."><input required minLength={8} type="password" autoComplete="new-password" value={f.password} onChange={set('password')} className={field} /></Field></div>
            </div>
            <label className="flex items-start gap-2 text-sm text-ink-500"><input required type="checkbox" checked={f.agree} onChange={set('agree')} className="mt-1 accent-brand-500" />I’m authorised to represent this business and agree to the <Link to="/terms-of-service" className="font-semibold text-brand-600">Terms</Link> and <Link to="/privacy-policy" className="font-semibold text-brand-600">Privacy Policy</Link>.</label>
            {err && <p className="text-sm text-rose-600">{err}</p>}
            <div className="flex gap-3"><button type="button" onClick={() => setI(2)} className="btn-ghost">← Back</button><button disabled={busy || !f.agree} className="btn-primary flex-1 py-3">{busy ? 'Submitting…' : 'Submit application'}</button></div>
          </form>
        )}
        {i < 2 && err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
      </div>
    </div>
  )
}
