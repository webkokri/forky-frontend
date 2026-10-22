import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAsync } from '../utils/useAsync'
import { useSite } from '../context/SiteContext'
import { toLocalPath } from '../utils/sitePaths'
import { Logo } from './Header'

const NETWORKS = { facebook: 'Facebook', instagram: 'Instagram', x: 'X', twitter: 'X', tiktok: 'TikTok', youtube: 'YouTube', linkedin: 'LinkedIn', pinterest: 'Pinterest', threads: 'Threads' }

// Link from the settings: internal paths use the router, others open normally.
function FooterLink({ l }) {
  const url = l.url || l.to || ''
  const label = l.label
  const cls = 'hover:text-white'
  if (/^https?:\/\//i.test(url) || /^(mailto|tel):/i.test(url)) return <a href={url} className={cls} {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>
  return <Link to={toLocalPath(url)} className={cls} {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</Link>
}

// Footer content comes from the API (settings > footer, social, contact, app links).
// Without it we show the bundled link columns.
export default function Footer() {
  const { site } = useSite()
  const { data: fallback } = useAsync(() => api.getFooter(), [])
  const f = site?.footer
  const columns = f?.columns?.length ? f.columns : (fallback || []).map((g) => ({ title: g.title, links: g.links.map((l) => ({ label: l.label, url: l.to })) }))
  const name = site?.site?.name || 'Forky'
  const social = f?.showSocial !== false ? (site?.social || []).filter((s) => s.url) : []
  const app = f?.showAppLinks !== false ? site?.appLinks : null
  const contact = f?.showContact !== false ? site?.contact : null
  const addr = contact?.address && [contact.address.line1, contact.address.city, contact.address.province].filter(Boolean).join(', ')
  const copyright = f?.copyright || site?.site?.copyright || `© ${new Date().getFullYear()} ${name}`

  return (
    <footer className="mt-20 bg-ink-900 text-ink-300">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div>
          <div className="rounded-xl bg-white/95 p-1.5 inline-block [&_span]:inline"><Logo dark /></div>
          <p className="mt-3 text-sm">{site?.site?.tagline || 'Meals from local kitchens and groceries from stores near you, delivered fast.'}</p>
          {(contact?.email || contact?.phone || addr) && (
            <ul className="mt-4 space-y-1 text-sm">
              {(contact.supportEmail || contact.email) && <li><a href={`mailto:${contact.supportEmail || contact.email}`} className="hover:text-white">✉ {contact.supportEmail || contact.email}</a></li>}
              {contact.phone && <li><a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} className="hover:text-white">☎ {contact.phone}</a></li>}
              {addr && <li>📍 {addr}</li>}
            </ul>
          )}
          {social.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{social.map((s) => <a key={s.network + s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/10 hover:text-white">{NETWORKS[s.network] || s.network}</a>)}</div>}
          {(app?.iosUrl || app?.androidUrl) && <div className="mt-4 flex gap-2 text-xs font-semibold">{app.iosUrl && <a href={app.iosUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">App Store</a>}{app.androidUrl && <a href={app.androidUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">▶ Google Play</a>}</div>}
        </div>
        {columns.map((g) => (
          <div key={g.title}>
            <h4 className="text-sm font-bold text-white">{g.title}</h4>
            <ul className="mt-3 space-y-2 text-sm">{(g.links || []).map((l) => <li key={l.label + l.url}><FooterLink l={l} /></li>)}</ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">
        {f?.legalText && <p className="container-x mb-2 text-ink-300/80">{f.legalText}</p>}
        <span>{copyright}</span>
        {(f?.bottomLinks?.length ? f.bottomLinks : [{ label: 'Terms', url: '/terms-of-service' }, { label: 'Privacy', url: '/privacy-policy' }]).map((l) => <span key={l.label}> · <FooterLink l={l} /></span>)}
      </div>
    </footer>
  )
}
