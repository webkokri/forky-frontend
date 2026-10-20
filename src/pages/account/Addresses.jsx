import { useState } from 'react'
import { api } from '../../api'
import { useAsync } from '../../utils/useAsync'
import { useLocation2 } from '../../context/LocationContext'
import AddressSearch from '../../components/AddressSearch'
import { Card, Empty, PageHead } from '../../components/AccountLayout'

const field = 'mt-1 w-full rounded-xl border border-ink-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500'
const DROP = [['HAND_TO_ME', 'Hand it to me'], ['LEAVE_AT_DOOR', 'Leave at my door'], ['MEET_OUTSIDE', 'Meet outside']]
const blank = (city = '') => ({ label: 'Home', line1: '', line2: '', city, province: 'ON', postalCode: '', dropoffMethod: 'HAND_TO_ME', dropoffNotes: '' })

export default function Addresses() {
  const { loc } = useLocation2()
  const { data, reload } = useAsync(() => api.listAddresses(), [])
  const [edit, setEdit] = useState(null) // null | 'new' | address
  const [f, setF] = useState(blank())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const open = (a) => { setErr(''); setEdit(a || 'new'); setF(a ? { ...blank(), ...Object.fromEntries(Object.entries(a).filter(([, v]) => v != null)) } : blank(loc?.city)) }
  const act = async (fn) => { setErr(''); try { await fn(); reload() } catch (e) { setErr(e.message) } }
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    const body = { label: f.label, line1: f.line1, line2: f.line2 || undefined, city: f.city, province: f.province, postalCode: f.postalCode, dropoffMethod: f.dropoffMethod, dropoffNotes: f.dropoffNotes || undefined, ...(f.lat != null ? { lat: f.lat, lng: f.lng } : edit === 'new' && loc?.lat != null ? { lat: loc.lat, lng: loc.lng } : {}) }
    try { edit === 'new' ? await api.addAddress({ ...body, isDefault: !(data || []).length }) : await api.updateAddress(edit.id, body); setEdit(null); reload() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <div>
      <PageHead title="Addresses" subtitle="Where should we deliver?" action={!edit && <button onClick={() => open()} className="btn-primary">+ Add address</button>} />
      {err && !edit && <p className="mb-3 text-sm text-rose-600">{err}</p>}
      {edit && (
        <Card className="mb-6">
          <h2 className="font-display text-xl font-bold">{edit === 'new' ? 'New address' : 'Edit address'}</h2>
          <div className="mt-4"><AddressSearch near={loc} onPick={(p) => setF((x) => ({ ...x, line1: p.line1, city: p.city || x.city, province: p.province || x.province, postalCode: p.postalCode || x.postalCode, lat: p.lat, lng: p.lng }))} placeholder="Start typing the address to fill it in" /></div>
          <form onSubmit={save} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold">Label<input value={f.label} onChange={set('label')} className={field} /></label>
            <label className="text-xs font-semibold">Street address<input required value={f.line1} onChange={set('line1')} className={field} /></label>
            <label className="text-xs font-semibold">Apt / unit<input value={f.line2} onChange={set('line2')} className={field} /></label>
            <label className="text-xs font-semibold">City<input required value={f.city} onChange={set('city')} className={field} /></label>
            <label className="text-xs font-semibold">Province<input value={f.province} onChange={set('province')} className={field} /></label>
            <label className="text-xs font-semibold">Postal code<input required value={f.postalCode} onChange={set('postalCode')} className={field} /></label>
            <label className="text-xs font-semibold">Drop-off<select value={f.dropoffMethod} onChange={set('dropoffMethod')} className={field}>{DROP.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="text-xs font-semibold">Instructions for the courier<input value={f.dropoffNotes} onChange={set('dropoffNotes')} maxLength={200} className={field} /></label>
            {err && <p className="text-sm text-rose-600 sm:col-span-2">{err}</p>}
            <div className="flex gap-2 sm:col-span-2"><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save address'}</button><button type="button" onClick={() => setEdit(null)} className="btn-ghost">Cancel</button></div>
          </form>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {(data || []).map((a) => (
          <Card key={a.id} className={a.isDefault ? '!border-brand-300' : ''}>
            <div className="flex items-start justify-between"><div className="font-bold">📍 {a.label || 'Address'}</div>{a.isDefault && <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">Default</span>}</div>
            <p className="mt-2 text-sm text-ink-700">{[a.line1, a.line2].filter(Boolean).join(', ')}<br />{a.city}, {a.province} {a.postalCode}</p>
            {a.dropoffNotes && <p className="mt-1 text-xs text-ink-500">“{a.dropoffNotes}”</p>}
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <button onClick={() => open(a)} className="text-brand-600">Edit</button>
              {!a.isDefault && <button onClick={() => act(() => api.setDefaultAddress(a.id))} className="text-brand-600">Make default</button>}
              <button onClick={() => window.confirm('Delete this address?') && act(() => api.deleteAddress(a.id))} className="text-rose-600">Delete</button>
            </div>
          </Card>
        ))}
      </div>
      {data && !data.length && !edit && <Empty icon="📍" title="No saved addresses" text="Add one to check out faster." />}
    </div>
  )
}
