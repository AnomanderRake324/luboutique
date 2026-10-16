import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useCatalogState } from '../lib/CatalogContext'
import { LANGS, isLang, t, type Lang } from '../lib/i18n'

export function useLang(): Lang {
  const { pathname } = useLocation()
  const first = pathname.split('/')[1]
  return isLang(first) ? first : 'ru'
}

export default function Layout() {
  const lang = useLang()
  const cs = useCatalogState()
  const [open, setOpen] = useState(false)
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  useEffect(() => { setOpen(false); window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  useEffect(() => {
    // hreflang-альтернативы (видны поисковикам, которые исполняют JS; см. docs/SEO.md)
    const base = window.location.origin, rest = pathname.replace(/^\/(ru|kk)/, '')
    document.head.querySelectorAll('link[data-alt]').forEach((n) => n.remove())
    for (const [hl, l] of [['ru', 'ru'], ['kk', 'kk'], ['x-default', 'ru']]) {
      const el = document.createElement('link'); el.rel = 'alternate'; el.hreflang = hl; el.href = `${base}/${l}${rest}`; el.dataset.alt = '1'; document.head.appendChild(el)
    }
  }, [pathname])

  const links = [
    ['', t(lang, 'nav_home')],
    ['/catalog', t(lang, 'nav_catalog')],
    ['/collections', t(lang, 'nav_collections')],
    ['/contacts', t(lang, 'nav_contacts')],
  ] as const
  const switchTo = (l: Lang) => { try { localStorage.setItem('lang', l) } catch { /* ignore */ } navigate(pathname.replace(/^\/(ru|kk)/, `/${l}`) + search) }

  if (cs.status !== 'ready') return <p className="min-h-screen grid place-items-center">{t(lang, 'loading')}</p>
  const { settings, isDemo } = cs.data
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-ink focus:text-ivory focus:p-3">{t(lang, 'skip')}</a>
      {isDemo && <div className="bg-ink text-ivory text-center text-xs tracking-wider py-2 px-4">{t(lang, 'demo_banner')}</div>}
      <header className="sticky top-0 z-40 bg-ivory/90 backdrop-blur border-b border-beige/60">
        <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between">
          <Link to={`/${lang}`} className="font-serif text-2xl text-ink tracking-wide">{settings.logo ? <img src={settings.logo} alt={settings.name} className="h-9 w-auto" /> : settings.name}</Link>
          <nav aria-label="Main" className="hidden md:flex gap-8 text-sm uppercase tracking-[.18em]">
            {links.map(([p, label]) => (
              <NavLink key={p} end={p === ''} to={`/${lang}${p}`} className={({ isActive }) => `hover:text-ink ${isActive ? 'text-ink border-b border-ink' : ''}`}>{label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex text-xs tracking-widest" role="group" aria-label={t(lang, 'language_label')}>
              {LANGS.map((l) => (
                <button key={l} onClick={() => switchTo(l)} aria-pressed={l === lang} className={`px-2 py-1 uppercase ${l === lang ? 'text-ink border-b border-ink' : 'text-charcoal/60'}`}>{l === 'kk' ? 'ҚАЗ' : 'РУС'}</button>
              ))}
            </div>
            <button className="md:hidden p-2" aria-label={t(lang, 'menu')} aria-expanded={open} onClick={() => setOpen(!open)}>
              <span className="block w-6 border-t border-ink mb-1.5" /><span className="block w-6 border-t border-ink" />
            </button>
          </div>
        </div>
        {open && (
          <nav aria-label="Mobile" className="md:hidden border-t border-beige/60 bg-ivory px-5 py-4 flex flex-col gap-4 uppercase tracking-[.18em] text-sm">
            {links.map(([p, label]) => <Link key={p} to={`/${lang}${p}`}>{label}</Link>)}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1"><Outlet /></main>
      <footer className="bg-cream mt-24 border-t border-beige">
        <div className="mx-auto max-w-7xl px-5 py-12 grid gap-6 md:grid-cols-3 text-sm">
          <div><p className="font-serif text-2xl text-ink">{settings.name}</p></div>
          <address className="not-italic leading-relaxed">{settings.address[lang]}</address>
          <div className="flex flex-col gap-1"><a href={`tel:+${settings.whatsapp}`} className="hover:text-ink">{settings.phone}</a>{settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-ink">Instagram</a>}{settings.tiktok && <a href={settings.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-ink">TikTok</a>}</div>
        </div>
        <p className="text-center text-xs py-4 border-t border-beige">© {new Date().getFullYear()} {settings.name}. {t(lang, 'footer_rights')}</p>
      </footer>
    </div>
  )
}
