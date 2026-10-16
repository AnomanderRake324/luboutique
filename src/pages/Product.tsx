import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLang } from '../components/Layout'
import { ProductImage, stockLabel } from '../components/ProductCard'
import { useCatalog } from '../lib/CatalogContext'
import { formatKZT, loc, t } from '../lib/i18n'
import { buildWhatsAppLink } from '../lib/whatsapp'

export default function ProductPage() {
  const lang = useLang()
  const { slug } = useParams()
  const { products, settings } = useCatalog()
  const p = products.find((x) => x.slug === slug)
  const [size, setSize] = useState(''), [color, setColor] = useState(''), [img, setImg] = useState(0)
  useEffect(() => { if (p) document.title = `${loc(p.name, lang)} — ${settings.name}` }, [p, lang, settings.name])
  if (!p) return <p className="py-32 text-center">{t(lang, 'not_found')}</p>
  const out = p.stockStatus === 'out'
  const chip = (active: boolean) => `px-4 py-2 border text-sm ${active ? 'bg-ink text-ivory border-ink' : 'border-beige'}`
  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 grid md:grid-cols-2 gap-10">
      <div>
        <div className="aspect-[3/4] bg-cream overflow-hidden"><ProductImage p={p} index={img} lang={lang} priority /></div>
        {p.images.length > 1 && <div className="flex gap-2 mt-3 overflow-x-auto">
          {p.images.map((src, i) => (
            <button key={src} onClick={() => setImg(i)} aria-label={`${i + 1}`} aria-pressed={img === i} className={`w-16 h-20 shrink-0 border ${img === i ? 'border-ink' : 'border-transparent'}`}><img src={src} alt="" loading="lazy" className="w-full h-full object-cover" /></button>
          ))}
        </div>}
      </div>
      <div className="md:pt-6">
        <Link to={`/${lang}/catalog`} className="text-xs uppercase tracking-widest">← {t(lang, 'back')}</Link>
        <h1 className="text-5xl mt-6">{loc(p.name, lang)}</h1>
        <p className="mt-3 text-xl">{formatKZT(p.price)}</p>
        <p className={`mt-2 text-sm ${out ? 'text-red-800' : ''}`}>{stockLabel(p.stockStatus, lang)}</p>
        <p className="mt-6 leading-relaxed">{loc(p.description, lang)}</p>
        <fieldset className="mt-8"><legend className="text-xs uppercase tracking-widest mb-2">{t(lang, 'size')}</legend>
          <div className="flex flex-wrap gap-2">{p.sizes.map((s) => <button key={s} aria-pressed={size === s} onClick={() => setSize(size === s ? '' : s)} className={chip(size === s)}>{s}</button>)}</div></fieldset>
        <fieldset className="mt-6"><legend className="text-xs uppercase tracking-widest mb-2">{t(lang, 'color')}</legend>
          <div className="flex flex-wrap gap-2">{p.colors.map((s) => <button key={s} aria-pressed={color === s} onClick={() => setColor(color === s ? '' : s)} className={chip(color === s)}>{s}</button>)}</div></fieldset>
        <a href={out ? undefined : buildWhatsAppLink(p, lang, settings.whatsapp, size, color)} target="_blank" rel="noopener noreferrer" aria-disabled={out}
          className={`mt-10 block text-center px-8 py-4 uppercase tracking-[.2em] text-xs ${out ? 'bg-beige text-charcoal/50 pointer-events-none' : 'bg-ink text-ivory hover:bg-charcoal'}`}>{t(lang, 'order_wa')}</a>
        <p className="mt-3 text-xs leading-relaxed text-charcoal/70">{t(lang, 'order_note')}</p>
      </div>
    </div>
  )
}
