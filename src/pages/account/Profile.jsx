import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../utils/useAsync'
import { Card, PageHead } from '../../components/AccountLayout'

const field = 'mt-1 w-full rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500'
const Toggle = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-2 text-sm"><span>{label}</span><input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand-500" /></label>
)
const DIETS = ['vegetarian', 'vegan', 'halal', 'gluten-free', 'dairy-free', 'nut-free']

export default function Profile() {
  const { logout } = useAuth()
  const { data: p, reload } = useAsync(() => api.getProfile(), [])
  const [f, setF] = useState({ firstName: '', lastName: '', language: 'en' })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [msg, setMsg] = useState({})
  useEffect(() => { if (p) setF({ firstName: p.firstName, lastName: p.lastName, language: p.language || 'en' }) }, [p])

  const say = (k, ok, text) => setMsg((m) => ({ ...m, [k]: { ok, text } }))
  const run = (k, fn, okText) => async (e) => { e?.preventDefault?.(); try { await fn(); say(k, true, okText); reload() } catch (x) { say(k, false, x.message) } }
  const Msg = ({ k }) => msg[k] ? <p className={`mt-2 text-sm font-semibold ${msg[k].ok ? 'text-mint-600' : 'text-rose-600'}`}>{msg[k].text}</p> : null
  const np = p?.notificationPrefs || {}
  const toggleNotif = (key) => (v) => api.updateNotifications({ [key]: v }).then(reload).catch((x) => say('notif', false, x.message))
  const diets = p?.dietaryPreferences || []

  return (
    <div className="space-y-6">
      <PageHead title="Profile & security" />
      <Card>
        <h2 className="font-display text-xl font-bold">Personal details</h2>
        <form onSubmit={run('profile', () => api.updateProfile(f), 'Profile saved')} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">First name<input required value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className={field} /></label>
          <label className="text-xs font-semibold">Last name<input required value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className={field} /></label>
          <label className="text-xs font-semibold">Email<input disabled value={p?.email || ''} className={`${field} bg-cream`} /></label>
          <label className="text-xs font-semibold">Phone<input disabled value={p?.phone || ''} className={`${field} bg-cream`} /></label>
          <label className="text-xs font-semibold">Language<select value={f.language} onChange={(e) => setF({ ...f, language: e.target.value })} className={field}><option value="en">English</option><option value="fr">Français</option></select></label>
          <div className="flex items-end"><button className="btn-primary">Save changes</button></div>
        </form>
        <Msg k="profile" />
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Dietary preferences</h2>
        <div className="mt-3 flex flex-wrap gap-2">{DIETS.map((d) => <button key={d} onClick={() => api.updateDietary({ dietaryPreferences: diets.includes(d) ? diets.filter((x) => x !== d) : [...diets, d] }).then(reload).catch((x) => say('diet', false, x.message))} className={`chip ${diets.includes(d) ? 'chip-active' : ''}`}>{d}</button>)}</div>
        <Msg k="diet" />
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Notifications</h2>
        <div className="mt-2 divide-y divide-ink-100">
          <Toggle label="Order updates" checked={np.orderUpdates} onChange={toggleNotif('orderUpdates')} />
          <Toggle label="Messages from my courier" checked={np.driverMessages} onChange={toggleNotif('driverMessages')} />
          <Toggle label="Offers & promotions" checked={np.promotions} onChange={toggleNotif('promotions')} />
          <Toggle label="Newsletter" checked={np.newsletters} onChange={toggleNotif('newsletters')} />
        </div><Msg k="notif" />
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Change password</h2>
        <form onSubmit={run('pw', async () => { await api.changePassword(pw); setPw({ currentPassword: '', newPassword: '' }) }, 'Password updated')} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">Current password<input required type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={field} /></label>
          <label className="text-xs font-semibold">New password<input required minLength={8} type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={field} /></label>
          <div><button className="btn-primary">Update password</button></div>
        </form><Msg k="pw" />
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Privacy & data</h2>
        <p className="mt-1 text-sm text-ink-500">Request a copy of your data or ask us to delete your account.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={run('priv', () => api.requestPrivacy('ACCESS', 'Requested from account page'), 'Request received. We’ll prepare your data export.')} className="btn-ghost">Request my data</button>
          {p?.deletionRequestedAt
            ? <button onClick={run('priv', () => api.cancelDeletion(), 'Deletion request cancelled')} className="btn-ghost">Cancel account deletion</button>
            : <button onClick={() => window.confirm('Request deletion of your account? You can cancel while it is pending.') && run('priv', async () => { await api.requestDeletion('Requested from account page'); }, 'Deletion requested. We’ll confirm by email.')()} className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">Delete my account</button>}
          <button onClick={logout} className="btn-ghost">Sign out</button>
        </div><Msg k="priv" />
      </Card>
    </div>
  )
}
