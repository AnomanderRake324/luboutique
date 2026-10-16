import { Link } from 'react-router-dom'
import { useLang } from '../components/Layout'
import ProductCard from '../components/ProductCard'
import { useCatalog } from '../lib/CatalogContext'
import { usePageMeta } from '../lib/seo'
import { loc, t } from '../lib/i18n'

export default function Collections() {
  const lang = useLang()
  const { products, collections } = useCatalog()
  usePageMeta(t(lang, 'collections_title') + ' — Любимый Бутик')
  return (
    <div className="mx-auto max-w-7xl px-5 pt-12">
      <h1 className="text-5xl mb-12">{t(lang, 'collections_title')}</h1>
      {collections.filter((c) => products.some((p) => p.collectionIds.includes(c.id))).map((c) => (
        <section key={c.id} className="mb-16">
          <div className="relative overflow-hidden p-8 md:p-12 mb-6" style={{ background: c.tone, color: c.cover || c.tone === '#2b2b2b' ? '#faf7f0' : '#111' }}>
            {c.cover && <><img src={c.cover} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" /><div className="absolute inset-0 bg-black/35" /></>}
            <div className="relative"><h2 className="text-4xl" style={{ color: 'inherit' }}>{loc(c.name, lang)}</h2>
            <p className="mt-2">{loc(c.blurb, lang)}</p></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
            {products.filter((p) => p.collectionIds.includes(c.id)).map((p) => <ProductCard key={p.id} p={p} lang={lang} />)}
          </div>
        </section>
      ))}
      <Link to={`/${lang}/catalog`} className="underline">{t(lang, 'hero_cta')}</Link>
    </div>
  )
}
