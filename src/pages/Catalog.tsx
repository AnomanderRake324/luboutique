import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLang } from '../components/Layout'
import ProductCard from '../components/ProductCard'
import { useCatalog } from '../lib/CatalogContext'
import { usePageMeta } from '../lib/seo'
import { loc, t } from '../lib/i18n'

const sel = 'border border-beige bg-ivory px-3 py-2 text-sm w-full'

export default function Catalog() {
  const lang = useLang()
  const { products: PRODUCTS, categories: CATEGORIES } = useCatalog()
  usePageMeta(t(lang, 'nav_catalog') + ' — Любимый Бутик')
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? '', cat = sp.get('cat') ?? '', size = sp.get('size') ?? '', color = sp.get('color') ?? '', sort = sp.get('sort') ?? ''
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  const sizes = [...new Set(PRODUCTS.flatMap((p) => p.sizes))]
  const colors = [...new Set(PRODUCTS.flatMap((p) => p.colors))]

  const list = useMemo(() => {
    let r = PRODUCTS.filter((p) =>
      (!q || (p.name.ru + ' ' + p.name.kk).toLowerCase().includes(q.toLowerCase())) &&
      (!cat || p.categoryId === cat) && (!size || p.sizes.includes(size)) && (!color || p.colors.includes(color)))
    if (sort === 'asc') r = [...r].sort((a, b) => a.price - b.price)
    if (sort === 'desc') r = [...r].sort((a, b) => b.price - a.price)
    return r
  }, [q, cat, size, color, sort])

  return (
    <div className="mx-auto max-w-7xl px-5 pt-12">
      <h1 className="text-5xl mb-8">{t(lang, 'nav_catalog')}</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        <label className="col-span-2 md:col-span-1 text-xs uppercase tracking-widest">{t(lang, 'search')}
          <input type="search" className={sel} value={q} placeholder={t(lang, 'search_ph')} onChange={(e) => set('q', e.target.value)} /></label>
        <label className="text-xs uppercase tracking-widest">{t(lang, 'category')}
          <select className={sel} value={cat} onChange={(e) => set('cat', e.target.value)}>
            <option value="">{t(lang, 'all')}</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{loc(c.name, lang)}</option>)}</select></label>
        <label className="text-xs uppercase tracking-widest">{t(lang, 'size')}
          <select className={sel} value={size} onChange={(e) => set('size', e.target.value)}>
            <option value="">{t(lang, 'all')}</option>{sizes.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="text-xs uppercase tracking-widest">{t(lang, 'color')}
          <select className={sel} value={color} onChange={(e) => set('color', e.target.value)}>
            <option value="">{t(lang, 'all')}</option>{colors.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="text-xs uppercase tracking-widest">{t(lang, 'sort')}
          <select className={sel} value={sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="">{t(lang, 'sort_default')}</option><option value="asc">{t(lang, 'sort_asc')}</option><option value="desc">{t(lang, 'sort_desc')}</option></select></label>
      </div>
      {list.length === 0 ? <p className="py-20 text-center">{t(lang, 'nothing_found')}</p> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">{list.map((p) => <ProductCard key={p.id} p={p} lang={lang} />)}</div>
      )}
    </div>
  )
}
