import { useEffect } from 'react'
import { useSite } from '../context/SiteContext'

const idOk = (v) => typeof v === 'string' && /^[A-Za-z0-9_-]{4,40}$/.test(v)
const script = (id, src, text) => {
  if (document.getElementById(id)) return
  const s = document.createElement('script'); s.id = id
  if (src) { s.src = src; s.async = true } else s.text = text
  document.head.appendChild(s)
}

// Loads the analytics/pixel ids from the site settings, only after the visitor agrees
// when `integrations.consentRequired` is on. Shows the consent banner when needed.
export default function Analytics() {
  const { site, consent, setConsent } = useSite()
  const i = site?.integrations || {}
  const ga = i.googleAnalyticsId, gtm = i.googleTagManagerId, ads = i.googleAdsId, meta = i.metaPixelId
  const clarity = i.microsoftClarityId || i.clarityProjectId || i.clarityId, tiktok = i.tiktokPixelId
  const any = [ga, gtm, ads, meta, clarity, tiktok].some(idOk)
  const allowed = any && (!i.consentRequired || consent === 'granted')

  useEffect(() => {
    if (!allowed) return
    window.dataLayer = window.dataLayer || []
    if (idOk(gtm)) {
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
      script('forksy-gtm', `https://www.googletagmanager.com/gtm.js?id=${gtm}`)
    }
    const gtagId = idOk(ga) ? ga : idOk(ads) ? ads : null
    if (gtagId) {
      window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) } // eslint-disable-line prefer-rest-params
      script('forksy-gtag', `https://www.googletagmanager.com/gtag/js?id=${gtagId}`)
      window.gtag('js', new Date())
      if (idOk(ga)) window.gtag('config', ga)
      if (idOk(ads)) window.gtag('config', ads)
    }
    if (idOk(meta)) {
      script('forksy-fbq', null, `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src='https://connect.facebook.net/en_US/fbevents.js';s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script');fbq('init','${meta}');fbq('track','PageView');`)
    }
    if (idOk(clarity)) {
      script('forksy-clarity', null, `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`)
    }
    if (idOk(tiktok)) {
      script('forksy-ttq', null, `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e){var n=document.createElement("script");n.async=!0;n.src="https://analytics.tiktok.com/i18n/pixel/events.js?sdkid="+e;var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(n,s)};ttq.load('${tiktok}');ttq.page()}(window,document,'ttq');`)
    }
  }, [allowed, ga, gtm, ads, meta, clarity, tiktok])

  if (!any || !i.consentRequired || consent) return null
  return (
    <div role="dialog" aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink-900 p-5 text-sm text-white shadow-2xl">
        <p className="min-w-[14rem] flex-1 text-ink-300">We use cookies to understand how the site is used and to improve it. You can accept or decline analytics and marketing cookies.</p>
        <div className="flex gap-2"><button onClick={() => setConsent('denied')} className="rounded-xl border border-white/30 px-4 py-2 font-semibold hover:bg-white/10">Decline</button><button onClick={() => setConsent('granted')} className="rounded-xl bg-brand-500 px-4 py-2 font-semibold hover:bg-brand-600">Accept</button></div>
      </div>
    </div>
  )
}
