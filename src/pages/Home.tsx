import { Link } from 'react-router-dom'
import { useLang } from '../components/Layout'
import BannerView from '../components/BannerView'
import ProductCard from '../components/ProductCard'
import { useCatalog } from '../lib/CatalogContext'
import { usePageMeta } from '../lib/seo'
import { t } from '../lib/i18n'

export default function Home() {
  const lang = useLang()
  const { products, settings, banners } = useCatalog()
  const hero = banners.find((b) => b.placement === 'hero')
  const promos = banners.filter((b) => b.placement === 'promo')
  usePageMeta(settings.name, t(lang, 'hero_sub'))
  const featured = products.filter((p) => p.featured).slice(0, 4)
  const fresh = products.filter((p) => p.isNew).slice(0, 4)
  const sections = [[t(lang, 'featured'), featured], [t(lang, 'new_arrivals'), fresh]] as const
  return (
    <>
      {hero ? <BannerView b={hero} lang={lang} tall as="h1" href={hero.link ? `/${lang}${hero.link}` : undefined} /> : (
      <section className="relative bg-cream">
        <div className="mx-auto max-w-7xl px-5 py-24 md:py-40 grid md:grid-cols-2 gap-10 items-center">
          <div className="fade-up">
            <p className="uppercase tracking-[.3em] text-xs mb-6">{t(lang, 'hero_sub')}</p>
            <h1 className="text-5xl md:text-7xl leading-[1.05]">{t(lang, 'hero_title')}</h1>
            <Link to={`/${lang}/catalog`} className="inline-block mt-10 bg-ink text-ivory px-8 py-4 uppercase tracking-[.2em] text-xs hover:bg-charcoal transition">{t(lang, 'hero_cta')}</Link>
          </div>
          <div className="aspect-[4/5] bg-beige" aria-hidden="true" />
        </div>
      </section>)}
      {products.length === 0 && <p className="text-center mt-20">{t(lang, 'empty_store')}</p>}
      {sections.map(([title, list]) => list.length > 0 && (
        <section key={title} className="mx-auto max-w-7xl px-5 mt-20">
          <h2 className="text-4xl mb-8">{title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">{list.map((p) => <ProductCard key={p.id} p={p} lang={lang} />)}</div>
        </section>
      ))}
      {promos.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 mt-20 grid gap-6 md:grid-cols-2">
          {promos.map((b) => <BannerView key={b.id} b={b} lang={lang} href={b.link ? `/${lang}${b.link}` : undefined} />)}
        </section>
      )}
    </>
  )
}
