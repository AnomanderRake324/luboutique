import { Link } from 'react-router-dom'
import { formatKZT, loc, t, type Lang } from '../lib/i18n'
import type { Product, StockStatus } from '../lib/types'

export function Placeholder({ tones, label }: { tones: string[]; label: string }) {
  return (
    <div className="w-full h-full flex items-end justify-start p-3" style={{ background: `linear-gradient(160deg, ${tones[0]}, ${tones[1] ?? tones[0]})` }} role="img" aria-label={label || 'placeholder'}>
      {label && <span className="text-[10px] uppercase tracking-widest bg-ivory/80 px-2 py-1">{label}</span>}
    </div>
  )
}

export function ProductImage({ p, index = 0, lang, priority = false }: { p: Product; index?: number; lang: Lang; priority?: boolean }) {
  const src = p.images[index]
  if (src) return <img src={src} alt={loc(p.name, lang)} loading={priority ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover" />
  return <Placeholder tones={p.tones} label={p.isDemo ? t(lang, 'demo_badge') : ''} />
}

export function stockLabel(s: StockStatus, lang: Lang) {
  return s === 'out' ? t(lang, 'out_of_stock') : s === 'low' ? t(lang, 'few_left') : t(lang, 'in_stock')
}

export default function ProductCard({ p, lang }: { p: Product; lang: Lang }) {
  return (
    <Link to={`/${lang}/product/${p.slug}`} className="group block fade-up">
      <div className="aspect-[3/4] overflow-hidden bg-cream relative">
        <div className="w-full h-full transition-transform duration-700 group-hover:scale-105"><ProductImage p={p} lang={lang} /></div>
        {p.stockStatus === 'out' && <span className="absolute top-3 right-3 bg-ink text-ivory text-[10px] uppercase tracking-widest px-2 py-1">{t(lang, 'out_of_stock')}</span>}
      </div>
      <h3 className="mt-3 text-xl">{loc(p.name, lang)}</h3>
      <p className="text-sm tracking-wide">{formatKZT(p.price)}</p>
    </Link>
  )
}
