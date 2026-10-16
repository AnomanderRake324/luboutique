import { useLang } from '../components/Layout'
import { useCatalog } from '../lib/CatalogContext'
import { usePageMeta } from '../lib/seo'
import { t } from '../lib/i18n'

export default function Contacts() {
  const lang = useLang()
  const STORE = useCatalog().settings
  usePageMeta(t(lang, 'contacts_title') + ' — ' + STORE.name)
  return (
    <div className="mx-auto max-w-3xl px-5 pt-12">
      <h1 className="text-5xl mb-10">{t(lang, 'contacts_title')}</h1>
      <dl className="grid gap-8">
        <div><dt className="text-xs uppercase tracking-widest mb-1">{t(lang, 'address')}</dt><dd className="text-xl">{STORE.address[lang]}</dd></div>
        <div><dt className="text-xs uppercase tracking-widest mb-1">{t(lang, 'phone')}</dt><dd className="text-xl"><a href={`tel:+${STORE.whatsapp}`}>{STORE.phone}</a></dd></div>
        {STORE.instagram && <div><dt className="text-xs uppercase tracking-widest mb-1">Instagram</dt><dd className="text-xl"><a href={STORE.instagram} target="_blank" rel="noopener noreferrer">{STORE.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</a></dd></div>}
      </dl>
      <a href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-block mt-10 bg-ink text-ivory px-8 py-4 uppercase tracking-[.2em] text-xs">{t(lang, 'write_wa')}</a>
    </div>
  )
}
