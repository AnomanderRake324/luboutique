import { useEffect, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase, mediaUrl } from '../lib/supabase'
import type { StockStatus } from '../lib/types'
import { errText, isDuplicate, optimizeImage, randSuffix, slugify, splitList } from './utils'

type Status = 'draft' | 'published' | 'archived'
interface Form {
  name_ru: string; name_kk: string; description_ru: string; description_kk: string; price: string
  category_id: string; sizes: string; colors: string; stock_status: StockStatus
  is_featured: boolean; is_new: boolean; slug: string; status: Status
}
interface Img { key: string; preview: string; blob?: Blob; path?: string; rowId?: string }
interface Cat { id: string; name_ru: string }

const EMPTY: Form = { name_ru: '', name_kk: '', description_ru: '', description_kk: '', price: '', category_id: '', sizes: '', colors: '', stock_status: 'in_stock', is_featured: false, is_new: true, slug: '', status: 'draft' }
const MAX_IMAGES = 10
const inp = 'border border-beige bg-ivory px-3 py-3 w-full mt-1'
const btn = 'border border-ink px-4 py-3 text-xs uppercase tracking-widest disabled:opacity-50'
const solid = 'bg-ink text-ivory px-4 py-3 text-xs uppercase tracking-widest disabled:opacity-50'

export default function ProductEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pid] = useState(() => id ?? crypto.randomUUID())
  const [exists, setExists] = useState(!!id)
  const [f, setF] = useState<Form>(EMPTY)
  const [imgs, setImgs] = useState<Img[]>([])
  const [removed, setRemoved] = useState<Img[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(''), [ok, setOk] = useState('')
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    const sb = supabase!
    void sb.from('categories').select('id,name_ru').order('sort_order').then(({ data }) => setCats((data ?? []) as Cat[]))
    if (!id) return
    void (async () => {
      const { data, error } = await sb.from('products').select('*, product_images(id,storage_path,sort_order)').eq('id', id).maybeSingle()
      if (error || !data) { setErr(error ? errText(error) : 'Товар не найден'); setLoading(false); return }
      setF({
        name_ru: data.name_ru, name_kk: data.name_kk, description_ru: data.description_ru, description_kk: data.description_kk,
        price: String(data.price_kzt), category_id: data.category_id ?? '', sizes: (data.sizes as string[]).join(', '), colors: (data.colors as string[]).join(', '),
        stock_status: data.stock_status, is_featured: data.is_featured, is_new: data.is_new, slug: data.slug, status: data.status,
      })
      const rows = [...(data.product_images as { id: string; storage_path: string; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order)
      setImgs(rows.map((r) => ({ key: r.id, rowId: r.id, path: r.storage_path, preview: mediaUrl(r.storage_path) })))
      setLoading(false)
    })()
  }, [id])

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    setErr(''); setOk('')
    if (imgs.length + files.length > MAX_IMAGES) return setErr(`Не больше ${MAX_IMAGES} фото на товар`)
    setBusy(true)
    const added: Img[] = []
    try {
      for (const file of files) { const blob = await optimizeImage(file); added.push({ key: crypto.randomUUID(), blob, preview: URL.createObjectURL(blob) }) }
    } catch (x) { setErr(errText(x)) }
    setImgs((p) => [...p, ...added]); setBusy(false)
  }
  const move = (i: number, d: -1 | 1) => setImgs((p) => { const n = [...p]; const j = i + d; if (j < 0 || j >= n.length) return p; [n[i], n[j]] = [n[j], n[i]]; return n })
  const makeCover = (i: number) => setImgs((p) => [p[i], ...p.filter((_, k) => k !== i)])
  const dropImg = (i: number) => { const im = imgs[i]; if (im.rowId) setRemoved((r) => [...r, im]); setImgs((p) => p.filter((_, k) => k !== i)) }

  async function save(target: Status) {
    setErr(''); setOk('')
    const price = Number(f.price)
    if (!f.name_ru.trim()) return setErr('Укажите название по-русски')
    if (f.price.trim() === '' || !Number.isInteger(price) || price < 0) return setErr('Цена — целое число в тенге')
    if (target === 'published' && imgs.length === 0) return setErr('Чтобы опубликовать товар, добавьте хотя бы одно фото')
    setBusy(true)
    const sb = supabase!
    try {
      const payload = {
        id: pid, name_ru: f.name_ru.trim(), name_kk: f.name_kk.trim(), description_ru: f.description_ru.trim(), description_kk: f.description_kk.trim(),
        price_kzt: price, category_id: f.category_id || null, sizes: splitList(f.sizes), colors: splitList(f.colors),
        stock_status: f.stock_status, is_featured: f.is_featured, is_new: f.is_new, status: target,
      }
      let slug = f.slug.trim() ? slugify(f.slug) : slugify(f.name_ru)
      let { error } = await sb.from('products').upsert({ ...payload, slug }, { onConflict: 'id' })
      if (error && isDuplicate(error)) { slug = `${slug}-${randSuffix()}`.slice(0, 80); ({ error } = await sb.from('products').upsert({ ...payload, slug }, { onConflict: 'id' })) }
      if (error) throw error
      setExists(true)

      // 1) удалить убранные фото
      if (removed.length) {
        const paths = removed.map((r) => r.path!).filter(Boolean)
        if (paths.length) await sb.storage.from('media').remove(paths)
        const { error: e1 } = await sb.from('product_images').delete().in('id', removed.map((r) => r.rowId!))
        if (e1) throw e1
        setRemoved([])
      }
      // 2) загрузить новые фото
      const final: Img[] = []
      for (const im of imgs) {
        if (!im.blob) { final.push(im); continue }
        const path = `products/${pid}/${crypto.randomUUID()}.webp`
        const up = await sb.storage.from('media').upload(path, im.blob, { contentType: 'image/webp', upsert: false })
        if (up.error) throw up.error
        const ins = await sb.from('product_images').insert({ product_id: pid, storage_path: path, sort_order: final.length, is_cover: false }).select('id').single()
        if (ins.error) throw ins.error
        final.push({ ...im, blob: undefined, path, rowId: ins.data.id as string })
      }
      // 3) порядок и обложка (первое фото = обложка)
      if (final.length) {
        const r0 = await sb.from('product_images').update({ is_cover: false }).eq('product_id', pid)
        if (r0.error) throw r0.error
        const res = await Promise.all(final.map((im, i) => sb.from('product_images').update({ sort_order: i, is_cover: i === 0 }).eq('id', im.rowId!)))
        const bad = res.find((r) => r.error); if (bad?.error) throw bad.error
      }
      setImgs(final); setF((p) => ({ ...p, slug, status: target }))
      setOk(target === 'published' ? 'Опубликовано' : target === 'archived' ? 'Перенесено в архив' : 'Сохранено как черновик')
      if (!id) navigate(`/admin/products/${pid}`, { replace: true })
    } catch (x) { setErr(errText(x)) } finally { setBusy(false) }
  }

  async function del() {
    if (!window.confirm('Удалить товар вместе с фотографиями? Это нельзя отменить.')) return
    setBusy(true)
    const sb = supabase!
    const paths = [...imgs, ...removed].map((i) => i.path).filter((p): p is string => !!p)
    if (paths.length) await sb.storage.from('media').remove(paths)
    const { error } = await sb.from('products').delete().eq('id', pid)
    setBusy(false)
    if (error) setErr(errText(error)); else navigate('/admin')
  }

  if (loading) return <p className="pt-12 text-center">Загрузка…</p>
  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-32">
      <Link to="/admin" className="text-xs uppercase tracking-widest">← Все товары</Link>
      <h1 className="text-4xl mt-4 mb-8">{exists ? 'Изменить товар' : 'Новый товар'}</h1>

      <h2 className="text-2xl mb-2">1. Фотографии</h2>
      <p className="text-sm mb-3">Первое фото — обложка. Фото автоматически уменьшаются перед загрузкой. До {MAX_IMAGES} штук.</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {imgs.map((im, i) => (
          <li key={im.key} className="border border-beige p-2">
            <div className="aspect-[3/4] bg-cream relative"><img src={im.preview} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />{i === 0 && <span className="absolute top-1 left-1 bg-ink text-ivory text-[10px] px-2 py-1 uppercase tracking-widest">Обложка</span>}</div>
            <div className="flex flex-wrap gap-1 mt-2 text-xs">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Сдвинуть влево" className="border border-ink px-2 py-1 disabled:opacity-30">←</button>
              <button type="button" disabled={i === imgs.length - 1} onClick={() => move(i, 1)} aria-label="Сдвинуть вправо" className="border border-ink px-2 py-1 disabled:opacity-30">→</button>
              {i !== 0 && <button type="button" onClick={() => makeCover(i)} className="border border-ink px-2 py-1">Обложка</button>}
              <button type="button" onClick={() => dropImg(i)} className="border border-red-800 text-red-800 px-2 py-1">Убрать</button>
            </div>
          </li>
        ))}
      </ul>
      <label className={`${btn} inline-block cursor-pointer`}>+ Добавить фото<input type="file" accept="image/*" multiple onChange={onFiles} disabled={busy} className="sr-only" /></label>

      <h2 className="text-2xl mt-10 mb-2">2. Описание</h2>
      <label className="block text-sm mb-4">Название (по-русски) *<input className={inp} value={f.name_ru} onChange={(e) => set('name_ru', e.target.value)} maxLength={120} /></label>
      <label className="block text-sm mb-4">Атауы (қазақша)<input className={inp} value={f.name_kk} onChange={(e) => set('name_kk', e.target.value)} maxLength={120} /></label>
      <label className="block text-sm mb-4">Описание (по-русски)<textarea className={inp} rows={4} value={f.description_ru} onChange={(e) => set('description_ru', e.target.value)} maxLength={4000} /></label>
      <label className="block text-sm mb-1">Сипаттама (қазақша)<textarea className={inp} rows={4} value={f.description_kk} onChange={(e) => set('description_kk', e.target.value)} maxLength={4000} /></label>
      <p className="text-xs mb-4">Если казахский текст пустой, на казахской версии сайта покажется русский.</p>
      <label className="block text-sm mb-4">Цена, ₸ *<input className={inp} inputMode="numeric" value={f.price} onChange={(e) => set('price', e.target.value.replace(/\D/g, ''))} /></label>
      <label className="block text-sm mb-4">Категория
        <select className={inp} value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
          <option value="">Без категории</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name_ru}</option>)}</select></label>
      <label className="block text-sm mb-4">Размеры (через запятую)<input className={inp} placeholder="S, M, L" value={f.sizes} onChange={(e) => set('sizes', e.target.value)} /></label>
      <label className="block text-sm mb-4">Цвета (через запятую)<input className={inp} placeholder="Бежевый, Чёрный" value={f.colors} onChange={(e) => set('colors', e.target.value)} /></label>
      <label className="block text-sm mb-4">Наличие
        <select className={inp} value={f.stock_status} onChange={(e) => set('stock_status', e.target.value as StockStatus)}>
          <option value="in_stock">В наличии</option><option value="low">Осталось мало</option><option value="out">Нет в наличии</option></select></label>
      <label className="flex items-center gap-3 text-sm mb-3"><input type="checkbox" checked={f.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />Показывать в «Избранном» на главной</label>
      <label className="flex items-center gap-3 text-sm mb-6"><input type="checkbox" checked={f.is_new} onChange={(e) => set('is_new', e.target.checked)} />Показывать в «Новинках» на главной</label>
      <details className="mb-8 text-sm"><summary className="cursor-pointer">Дополнительно: адрес страницы</summary>
        <label className="block mt-2">Адрес (латиницей). Если пусто — создастся из названия.<input className={inp} value={f.slug} onChange={(e) => set('slug', e.target.value)} maxLength={80} /></label></details>

      <h2 className="text-2xl mb-2">3. Сохранить</h2>
      <p className="text-sm mb-3">Сейчас статус: <b>{f.status === 'published' ? 'опубликован' : f.status === 'archived' ? 'в архиве' : 'черновик'}</b></p>
      {err && <p role="alert" className="text-red-800 mb-3">{err}</p>}
      {ok && <p role="status" className="mb-3">{ok}</p>}
      <div className="flex flex-wrap gap-3">
        {f.status === 'published' ? (<>
          <button disabled={busy} onClick={() => save('published')} className={solid}>Сохранить изменения</button>
          <button disabled={busy} onClick={() => save('draft')} className={btn}>Снять с публикации</button>
        </>) : (<>
          <button disabled={busy} onClick={() => save('draft')} className={btn}>{f.status === 'archived' ? 'Вернуть в черновики' : 'Сохранить черновик'}</button>
          <button disabled={busy} onClick={() => save('published')} className={solid}>Опубликовать</button>
        </>)}
        {f.status !== 'archived' && exists && <button disabled={busy} onClick={() => save('archived')} className={btn}>В архив</button>}
        {exists && <button disabled={busy} onClick={del} className={`${btn} border-red-800 text-red-800`}>Удалить</button>}
      </div>
      {busy && <p className="mt-4 text-sm">Подождите, идёт сохранение…</p>}
    </div>
  )
}
