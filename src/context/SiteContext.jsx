import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api'
import { API_ORIGIN } from '../api/client'
import { isPrivatePath, toApiPath } from '../utils/sitePaths'

// Website settings from the API (/public/site): logo + icons, SEO defaults, footer,
// analytics ids and custom CSS/JS. Cached in localStorage so the page paints with the
// last known settings; the live values replace them as soon as they arrive.
const CACHE = 'forksy_site'
const CONSENT = 'forksy_consent'
const Ctx = createContext(null)
const safe = (fn, d = null) => { try { return fn() } catch { return d } }
const readCache = () => safe(() => JSON.parse(localStorage.getItem(CACHE)))

// URLs from the API may use its own host; load them through the same origin we call the API on.
const viaApi = (u) => { try { const x = new URL(u, API_ORIGIN || window.location.origin); return `${API_ORIGIN}${x.pathname}${x.search}` } catch { return u } }
const safeHref = (u) => /^(https?:\/\/|\/|mailto:|tel:)/i.test(u || '')

const HEAD_ATTR = 'data-forksy-head'
function setAttrs(el, obj) {
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || v === false || typeof v === 'object') return
    if ((k === 'href' || k === 'src') && !safeHref(String(v))) return
    el.setAttribute(k, String(v))
  })
}

// Replace the managed <head> tags with the ones for this page.
function applyHead(h) {
  document.querySelectorAll(`[${HEAD_ATTR}]`).forEach((n) => n.remove())
  if (h.title) document.title = h.title
  if (h.htmlLang) document.documentElement.lang = h.htmlLang
  const add = (tag, attrs) => { const el = document.createElement(tag); setAttrs(el, attrs); el.setAttribute(HEAD_ATTR, ''); document.head.appendChild(el) }
  ;(h.meta || []).forEach((m) => add('meta', m))
  ;(h.link || []).forEach((l) => add('link', l))
  if (h.themeColor && !(h.meta || []).some((m) => m.name === 'theme-color')) add('meta', { name: 'theme-color', content: h.themeColor })
  if (h.canonical && !(h.link || []).some((l) => l.rel === 'canonical')) add('link', { rel: 'canonical', href: h.canonical })
  ;(h.jsonLd || []).forEach((obj) => {
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.textContent = JSON.stringify(obj).replace(/</g, '\\u003c')
    el.setAttribute(HEAD_ATTR, '')
    document.head.appendChild(el)
  })
}

// Head built from /public/site when the per-page head endpoint is unavailable.
function fallbackHead(site, path) {
  const seo = site?.seo, b = site?.branding || {}
  const meta = []
  if (seo?.description) meta.push({ name: 'description', content: seo.description })
  if (seo?.keywords?.length) meta.push({ name: 'keywords', content: seo.keywords.join(', ') })
  if (seo?.robots) meta.push({ name: 'robots', content: seo.robots })
  meta.push({ property: 'og:site_name', content: site?.site?.name || 'Forky' }, { property: 'og:type', content: 'website' })
  if (seo?.title) meta.push({ property: 'og:title', content: seo.title })
  if (seo?.description) meta.push({ property: 'og:description', content: seo.description })
  if (b.ogImage) meta.push({ property: 'og:image', content: b.ogImage }, { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:image', content: b.twitterImage || b.ogImage })
  const link = []
  if (b.favicon) link.push({ rel: 'icon', href: b.favicon })
  if (b.appleTouchIcon) link.push({ rel: 'apple-touch-icon', href: b.appleTouchIcon })
  if (site?.files?.manifest) link.push({ rel: 'manifest', href: viaApi(site.files.manifest) })
  return { title: seo?.title, htmlLang: site?.site?.language, themeColor: site?.site?.themeColor, meta, link, jsonLd: [], canonical: `${window.location.origin}${path}` }
}

export function SiteProvider({ children }) {
  const [site, setSite] = useState(readCache)
  const [loaded, setLoaded] = useState(false)
  const [override, setOverride] = useState(null) // per-page title/description from a page that knows better (CMS pages)
  const [headSource, setHeadSource] = useState(null)
  const { pathname, search } = useLocation()
  const lastGood = useRef(null)

  useEffect(() => {
    api.getSite().then((s) => { setSite(s); safe(() => localStorage.setItem(CACHE, JSON.stringify(s))) }).catch(() => {}).finally(() => setLoaded(true))
  }, [])

  // <head> for every page: title, description, meta tags, canonical, JSON-LD.
  const lang = site?.site?.language
  useEffect(() => {
    if (!loaded && !site) return undefined
    let alive = true
    const path = toApiPath(pathname, search)
    api.getHead(path, lang).catch(() => null).then((h) => {
      if (!alive) return
      let head = h || lastGood.current || fallbackHead(site, pathname)
      if (h) lastGood.current = h
      const src = h?.source || 'fallback'
      setHeadSource(src)
      // Canonical + manifest follow where this site is actually served from.
      const self = `${window.location.origin}${pathname}`
      head = { ...head, canonical: self, link: (head.link || []).map((l) => (l.rel === 'canonical' ? { ...l, href: self } : l.rel === 'manifest' && l.href ? { ...l, href: viaApi(l.href) } : l)) }
      if (override && (src === 'default' || src === 'fallback')) {
        head = { ...head, title: override.title ? `${override.title} | ${site?.site?.name || 'Forky'}` : head.title, meta: [...(head.meta || []).filter((m) => m.name !== 'description' && m.property !== 'og:description' && m.property !== 'og:title'), ...(override.description ? [{ name: 'description', content: override.description }, { property: 'og:description', content: override.description }] : []), ...(override.title ? [{ property: 'og:title', content: override.title }] : [])] }
      }
      if (isPrivatePath(pathname)) head = { ...head, meta: [...(head.meta || []).filter((m) => m.name !== 'robots'), { name: 'robots', content: 'noindex, nofollow' }], jsonLd: [] }
      applyHead(head)
    })
    return () => { alive = false }
  }, [pathname, search, lang, loaded, site?.version, override]) // eslint-disable-line react-hooks/exhaustive-deps

  // Custom CSS / JS from the settings. Scripts are pinned with the SHA-384 hash the API publishes.
  const scripts = site?.scripts
  useEffect(() => {
    const nodes = []
    if (scripts?.enabled) {
      const add = (parent, tag, attrs) => { const el = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => v && el.setAttribute(k, v)); el.setAttribute('data-forksy-custom', ''); parent.appendChild(el); nodes.push(el) }
      if (scripts.customCss?.url) add(document.head, 'link', { rel: 'stylesheet', href: viaApi(scripts.customCss.url), integrity: scripts.customCss.sha384, crossorigin: scripts.customCss.sha384 ? 'anonymous' : '' })
      if (scripts.headJs?.url) add(document.head, 'script', { src: viaApi(scripts.headJs.url), integrity: scripts.headJs.sha384, crossorigin: 'anonymous', defer: '' })
      if (scripts.bodyJs?.url) add(document.body, 'script', { src: viaApi(scripts.bodyJs.url), integrity: scripts.bodyJs.sha384, crossorigin: 'anonymous', defer: '' })
    }
    return () => nodes.forEach((n) => n.remove())
  }, [scripts?.enabled, scripts?.customCss?.url, scripts?.headJs?.url, scripts?.bodyJs?.url]) // eslint-disable-line react-hooks/exhaustive-deps

  const [consent, setConsentState] = useState(() => safe(() => localStorage.getItem(CONSENT)))
  const setConsent = useCallback((v) => { setConsentState(v); safe(() => localStorage.setItem(CONSENT, v)) }, [])
  const setPageMeta = useCallback((m) => setOverride(m), [])

  const value = useMemo(() => ({ site, loaded, headSource, consent, setConsent, setPageMeta }), [site, loaded, headSource, consent, setConsent, setPageMeta])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useSite = () => useContext(Ctx)

// Page-level title/description (used by CMS pages); only applied when the API has no specific rule for the page.
export function usePageMeta(meta) {
  const { setPageMeta } = useSite()
  const key = meta ? `${meta.title}|${meta.description}` : ''
  useEffect(() => { setPageMeta(meta || null); return () => setPageMeta(null) }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
}
