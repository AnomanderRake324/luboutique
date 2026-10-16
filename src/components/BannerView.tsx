import { Link } from 'react-router-dom'
import { loc, t, type Lang } from '../lib/i18n'
import type { Banner } from '../lib/types'

interface Props { b: Banner; lang: Lang; tall?: boolean; as?: 'h1' | 'h2'; href?: string; previewCta?: boolean }

export default function BannerView({ b, lang, tall = false, as: H = 'h2', href, previewCta = false }: Props) {
  const light = b.style.color === 'light'
  const fg = light ? '#faf7f0' : '#111111'
  const veil = light ? `rgba(0,0,0,${b.style.overlay / 100})` : `rgba(250,247,240,${b.style.overlay / 100})`
  const pos = b.align === 'left' ? 'items-start text-left' : b.align === 'center' ? 'items-center text-center' : 'items-end text-right'
  const family = b.style.font === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)'
  const sub = loc(b.subtitle, lang)
  const cta = `inline-block mt-2 border px-6 py-3 uppercase tracking-[.2em] text-xs`
  return (
    <div className={`relative overflow-hidden flex ${tall ? 'min-h-[60vh] md:min-h-[75vh]' : 'min-h-[280px] md:min-h-[360px]'}`} style={{ background: 'linear-gradient(160deg,#e8dfcc,#cbbfa5)' }}>
      {b.image && <img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" loading={tall ? 'eager' : 'lazy'} />}
      <div className="absolute inset-0" style={{ background: veil }} />
      <div className={`relative z-10 w-full flex flex-col justify-center gap-3 px-6 md:px-16 py-12 ${pos}`} style={{ color: fg, fontFamily: family }}>
        <H className="text-4xl md:text-6xl leading-tight" style={{ color: fg, fontFamily: family }}>{loc(b.headline, lang)}</H>
        {sub && <p className="text-lg md:text-xl max-w-xl" style={{ fontWeight: 400 }}>{sub}</p>}
        {href && <Link to={href} className={cta} style={{ borderColor: fg }}>{t(lang, 'banner_cta')}</Link>}
        {!href && previewCta && <span className={cta} style={{ borderColor: fg }}>{t(lang, 'banner_cta')}</span>}
      </div>
    </div>
  )
}
