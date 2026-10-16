import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import BannerView from '../components/BannerView'
import { mediaUrl, supabase } from '../lib/supabase'
import { parseStyle } from '../lib/banner'
import type { Align, Banner } from '../lib/types'
import type { Lang } from '../lib/i18n'
import { FORMATS, TEMPLATES, TPL_KEYS, isTemplateText, renderBannerPng, type Tpl } from './bannerTemplates'
import { errText } from './utils'

interface F { template: Tpl; headline_ru: string; headline_kk: string; subtitle_ru: string; subtitle_kk: string; image_path: string | null; align: Align; color: 'light' | 'dark'; overlay: number; font: 'serif' | 'sans'; link_path: string; placement: 'hero' | 'promo'; status: 'draft' | 'published' }
interface Photo { storage_path: string; name: string }
const LINKS = [['', 'Без ссылки'], ['/catalog', 'Каталог'], ['/collections', 'Коллекции'], ['/contacts', 'Контакты']] as const
const inp = 'border border-beige bg-ivory px-3 py-3 w-full mt-1'
const btn = 'border border-ink px-4 py-3 text-xs uppercase tracking-widest disabled:opacity-50'
const solid = 'bg-ink text-ivory px-4 py-3 text-xs uppercase tracking-widest disabled:opacity-50'

function fromTemplate(t: Tpl, prev?: Partial<F>): F {
  const d = TEMPLATES[t]
  return { template: t, headline_ru: d.ru[0], headline_kk: d.kk[0], subtitle_ru: d.ru[1], subtitle_kk: d.kk[1], image_path: prev?.image_path ?? null, align: d.align, color: d.style.color, overlay: d.style.overlay, font: d.style.font, link_path: prev?.link_path ?? '/catalog', placement: prev?.placement ?? 'hero', status: 'draft' }
}

export default function BannerEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bid] = useState(() => id ?? crypto.randomUUID())
  const [exists, setExists] = useState(!!id)
  const [f, setF] = useState<F>(() => fromTemplate('new_collection'))
  const [photos, setPhotos] = useState<Photo[]>([])
  const [storeName, setStoreName] = useState('Любимый Бутик')
  const [lang, setLang] = useState<Lang>('ru')
  const [fmt, setFmt] = useState<string>('square')
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(''), [ok, setOk] = useState('')
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    const sb = supabase!
    void sb.from('product_images').select('storage_path, products(name_ru)').order('created_at', { ascending: false }).limit(80).then(({ data }) =>
      setPhotos(((data ?? []) as unknown as { storage_path: string; products: { name_ru: string } | null }[]).map((r) => ({ storage_path: r.storage_path, name: r.products?.name_ru ?? '' }))))
    void sb.from('store_settings').select('store_name').maybeSingle().then(({ data }) => data?.store_name && setStoreName(data.store_name))
    if (!id) return
    void sb.from('banners').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { setErr(error ? errText(error) : 'Баннер не найден'); setLoading(false); return }
      const st = parseStyle(data.style)
      setF({ template: data.template, headline_ru: data.headline_ru, headline_kk: data.headline_kk, subtitle_ru: data.subtitle_ru, subtitle_kk: data.subtitle_kk, image_path: data.image_path, align: data.text_align, color: st.color, overlay: st.overlay, font: st.font, link_path: data.link_path ?? '', placement: data.placement, status: data.status })
      setLoading(false)
    })
  }, [id])

  const preview: Banner = useMemo(() => ({
    id: bid, template: f.template, headline: { ru: f.headline_ru, kk: f.headline_kk }, subtitle: { ru: f.subtitle_ru, kk: f.subtitle_kk },
    image: f.image_path ? mediaUrl(f.image_path) : null, align: f.align, style: { color: f.color, overlay: f.overlay, font: f.font }, link: f.link_path || null, placement: f.placement,
  }), [f, bid])

  function pickTemplate(t: Tpl) {
    if (isTemplateText(f.headline_ru) || window.confirm('Заменить тексты и стиль на шаблон? Ваши изменения заголовка будут потеряны.')) setF(fromTemplate(t, f))
    else set('template', t)
  }

  async function save(target: 'draft' | 'published') {
    setErr(''); setOk('')
    if (!f.headline_ru.trim()) return setErr('Введите заголовок по-русски')
    if (target === 'published' && !f.image_path) return setErr('Для публикации выберите фотографию')
    setBusy(true)
    const { error } = await supabase!.from('banners').upsert({
      id: bid, template: f.template, headline_ru: f.headline_ru.trim(), headline_kk: f.headline_kk.trim(), subtitle_ru: f.subtitle_ru.trim(), subtitle_kk: f.subtitle_kk.trim(),
      image_path: f.image_path, text_align: f.align, style: { color: f.color, overlay: f.overlay, font: f.font }, link_path: f.link_path || null, placement: f.placement, status: target,
    }, { onConflict: 'id' })
    setBusy(false)
    if (error) return setErr(errText(error))
    setExists(true); set('status', target); setOk(target === 'published' ? 'Опубликовано' : 'Сохранено как черновик')
    if (!id) navigate(`/admin/banners/${bid}`, { replace: true })
  }
  async function del() {
    if (!window.confirm('Удалить баннер?')) return
    const { error } = await supabase!.from('banners').delete().eq('id', bid)
    if (error) setErr(errText(error)); else navigate('/admin/banners')
  }
  async function download() {
    setErr(''); setOk('')
    if (!f.image_path) return setErr('Сначала выберите фотографию')
    const fm = FORMATS.find((x) => x.id === fmt)!
    setBusy(true)
    try {
      const blob = await renderBannerPng({ imageUrl: mediaUrl(f.image_path), headline: lang === 'kk' && f.headline_kk ? f.headline_kk : f.headline_ru, subtitle: lang === 'kk' && f.headline_kk ? f.subtitle_kk : f.subtitle_ru, align: f.align, style: { color: f.color, overlay: f.overlay, font: f.font }, storeName, w: fm.w, h: fm.h })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `banner-${fm.id}-${lang}.png`; document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); setOk('Картинка скачана')
    } catch (x) { setErr(errText(x)) } finally { setBusy(false) }
  }

  if (loading) return <p className="pt-12 text-center">Загрузка…</p>
  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-32">
      <Link to="/admin/banners" className="text-xs uppercase tracking-widest">← Все баннеры</Link>
      <h1 className="text-4xl mt-4 mb-6">{exists ? 'Изменить баннер' : 'Новый баннер'}</h1>

      <h2 className="text-2xl mb-2">1. Шаблон</h2>
      <div className="grid grid-cols-2 gap-2 mb-8">{TPL_KEYS.map((k) => <button key={k} onClick={() => pickTemplate(k)} aria-pressed={f.template === k} className={`${btn} ${f.template === k ? 'bg-ink text-ivory' : ''}`}>{TEMPLATES[k].label}</button>)}</div>

      <h2 className="text-2xl mb-2">2. Фотография</h2>
      <p className="text-sm mb-3">Выберите из уже загруженных фото товаров.</p>
      {photos.length === 0 ? <p className="text-sm mb-6">Фото пока нет. Сначала добавьте товар с фотографиями.</p> : (
        <ul className="grid grid-cols-4 gap-2 mb-8 max-h-72 overflow-y-auto">{photos.map((p) => (
          <li key={p.storage_path}><button onClick={() => set('image_path', p.storage_path)} aria-pressed={f.image_path === p.storage_path} aria-label={p.name || 'Фото'} className={`block w-full aspect-[3/4] border-2 ${f.image_path === p.storage_path ? 'border-ink' : 'border-transparent'}`}><img src={mediaUrl(p.storage_path)} alt={p.name} loading="lazy" className="w-full h-full object-cover" /></button></li>))}
        </ul>)}

      <h2 className="text-2xl mb-2">3. Текст и стиль</h2>
      <label className="block text-sm mb-4">Заголовок (по-русски) *<input className={inp} value={f.headline_ru} maxLength={120} onChange={(e) => set('headline_ru', e.target.value)} /></label>
      <label className="block text-sm mb-4">Подзаголовок (по-русски)<input className={inp} value={f.subtitle_ru} maxLength={240} onChange={(e) => set('subtitle_ru', e.target.value)} /></label>
      <label className="block text-sm mb-4">Тақырып (қазақша)<input className={inp} value={f.headline_kk} maxLength={120} onChange={(e) => set('headline_kk', e.target.value)} /></label>
      <label className="block text-sm mb-4">Қосымша жол (қазақша)<input className={inp} value={f.subtitle_kk} maxLength={240} onChange={(e) => set('subtitle_kk', e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block text-sm">Выравнивание<select className={inp} value={f.align} onChange={(e) => set('align', e.target.value as Align)}><option value="left">Слева</option><option value="center">По центру</option><option value="right">Справа</option></select></label>
        <label className="block text-sm">Цвет текста<select className={inp} value={f.color} onChange={(e) => set('color', e.target.value as F['color'])}><option value="light">Светлый</option><option value="dark">Тёмный</option></select></label>
        <label className="block text-sm">Шрифт<select className={inp} value={f.font} onChange={(e) => set('font', e.target.value as F['font'])}><option value="serif">С засечками</option><option value="sans">Без засечек</option></select></label>
        <label className="block text-sm">Затемнение фото: {f.overlay}%<input type="range" min={0} max={80} step={5} value={f.overlay} onChange={(e) => set('overlay', Number(e.target.value))} className="w-full mt-3" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <label className="block text-sm">Где показывать<select className={inp} value={f.placement} onChange={(e) => set('placement', e.target.value as F['placement'])}><option value="hero">Главный (вверху главной)</option><option value="promo">Промо (под товарами)</option></select></label>
        <label className="block text-sm">Кнопка «Подробнее» ведёт<select className={inp} value={f.link_path} onChange={(e) => set('link_path', e.target.value)}>{LINKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>

      <h2 className="text-2xl mb-2">4. Предпросмотр</h2>
      <div className="flex gap-2 mb-3" role="group" aria-label="Язык предпросмотра">{(['ru', 'kk'] as Lang[]).map((l) => <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`${btn} ${lang === l ? 'bg-ink text-ivory' : ''}`}>{l === 'ru' ? 'Русский' : 'Қазақша'}</button>)}</div>
      <BannerView b={preview} lang={lang} previewCta={!!f.link_path} />

      <h2 className="text-2xl mt-10 mb-2">5. Сохранить и скачать</h2>
      {err && <p role="alert" className="text-red-800 mb-3">{err}</p>}
      {ok && <p role="status" className="mb-3">{ok}</p>}
      <p className="text-sm mb-3">Статус: <b>{f.status === 'published' ? 'опубликован' : 'черновик'}</b></p>
      <div className="flex flex-wrap gap-3 mb-8">
        {f.status === 'published' ? (<><button disabled={busy} onClick={() => save('published')} className={solid}>Сохранить изменения</button><button disabled={busy} onClick={() => save('draft')} className={btn}>Снять с публикации</button></>)
          : (<><button disabled={busy} onClick={() => save('draft')} className={btn}>Сохранить черновик</button><button disabled={busy} onClick={() => save('published')} className={solid}>Опубликовать</button></>)}
        {exists && <button disabled={busy} onClick={del} className={`${btn} border-red-800 text-red-800`}>Удалить</button>}
      </div>
      <div className="border border-beige p-3">
        <p className="text-sm mb-2">Картинка для соцсетей (язык — как в предпросмотре):</p>
        <select className={inp} value={fmt} onChange={(e) => setFmt(e.target.value)} aria-label="Формат">{FORMATS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        <button disabled={busy} onClick={download} className={`${btn} mt-3`}>Скачать PNG</button>
      </div>
    </div>
  )
}
