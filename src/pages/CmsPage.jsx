import { useParams } from 'react-router-dom'
import { api } from '../api'
import { useAsync } from '../utils/useAsync'
import { Section, slugify } from '../components/PageRenderer'
import { Skeleton } from '../components/ui'
import { usePageMeta } from '../context/SiteContext'
import NotFound from './NotFound'

export default function CmsPage({ slug: fixed }) {
  const params = useParams()
  const slug = fixed || params.slug
  const { data: page, error, loading } = useAsync(() => api.getPage(slug), [slug])

  usePageMeta(page ? { title: page.title, description: page.description } : null)

  if (loading) return <div className="container-x space-y-4 py-16"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-64" /></div>
  if (error) return error.status === 404 || /not found/i.test(error.message) ? <NotFound /> : <div className="container-x py-24 text-center text-ink-500">Couldn’t load this page. Please try again.</div>

  const legal = page.layout === 'legal'
  const toc = legal ? page.sections.filter((s) => s.heading) : []
  return (
    <div>
      <header className="border-b border-brand-100 bg-gradient-to-br from-[#fff6d6] via-[#ffe3c9] to-[#ffc3b0]">
        <div className="container-x py-12 md:py-16">
          <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">{page.title}</h1>
          {page.subtitle && <p className="mt-3 max-w-2xl text-lg text-ink-700">{page.subtitle}</p>}
          {legal && page.updatedAt && <p className="mt-4 text-sm text-ink-500">Last updated {new Date(page.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
        </div>
      </header>
      <div className={`container-x py-12 ${legal ? 'grid gap-10 lg:grid-cols-[16rem_1fr]' : ''}`}>
        {legal && (
          <nav aria-label="On this page" className="hidden lg:block">
            <ul className="sticky top-24 space-y-2 border-l border-ink-100 text-sm">
              {toc.map((s) => <li key={s.heading}><a href={`#${slugify(s.heading)}`} className="-ml-px block border-l-2 border-transparent pl-4 text-ink-500 hover:border-brand-500 hover:text-brand-600">{s.heading}</a></li>)}
            </ul>
          </nav>
        )}
        <div className={`space-y-12 ${legal ? '' : 'mx-auto max-w-4xl'}`}>
          {page.sections.map((s, i) => <Section key={i} s={s} />)}
        </div>
      </div>
    </div>
  )
}
