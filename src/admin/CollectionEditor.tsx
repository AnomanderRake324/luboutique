import { useEffect, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mediaUrl, supabase } from '../lib/supabase'
import { errText, isDuplicate, optimizeImage, randSuffix, slugify } from './utils'

interface Prod { id: string; name_ru: string; status: string }
const inp = 'border border-beige bg-ivory px-3 py-3 w-full mt-1'
const btn = 'border border-ink px-4 py-3 text-xs uppercase tracking-widest disabled:opacity-50'

export default function CollectionEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cid] = useState(() => id ?? crypto.randomUUID())
  const [exists, setExists] = useState(!!id)
  const [f, setF] = useState({ name_ru: '', name_kk: '', description_ru: '', description_kk: '', is_public: false, slug: '' })
  const [cover, setCover] = useState<string | null>(null)       // сохранённый путь
  const [pending, setPending] = useState<{ blob: Blob; preview: string } | null>(null)
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [prods, setProds] = useState<Prod[]>([])
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [orig, setOrig] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(!!id)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(''), [ok, setOk] = useState('')

  useEffect(() => {
    const sb = supabase!
    void sb.from('products').select('id,name_ru,status').neq('status', 'archived').order('created_at', { ascending: false }).then(({ data }) => setProds((data ?? []) as Prod[]))
    if (!id) return
    void (async () => {
      const [c, m] = await Promise.all([sb.from('collections').select('*').eq('id', id).maybeSingle(), sb.from('collection_products').select('product_id').eq('collection_id', id)])
      if (c.error || !c.data) { setErr(c.error ? errText(c.error) : 'Коллекция не найдена'); setLoading(false); return }
      const d = c.data
      setF({ name_ru: d.name_ru, name_kk: d.name_kk, description_ru: d.description_ru, description_kk: d.description_kk, is_public: d.is_public, slug: d.slug })
      setCover(d.cover_path)
      const ids = new Set(((m.data ?? []) as { product_id: string }[]).map((x) => x.product_id))
      setSel(ids); setOrig(new Set(ids)); setLoading(false)
    })()
  }, [id])

  async function onCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setErr('')
    try { const blob = await optimizeImage(file); setPending({ blob, preview: URL.createObjectURL(blob) }); setCoverRemoved(false) } catch (x) { setErr(errText(x)) }
  }
  const toggle = (pid: string) => setSel((p) => { const n = new Set(p); if (n.has(pid)) n.delete(pid); else n.add(pid); return n })

  async function save() {
    setErr(''); setOk('')
    if (!f.name_ru.trim()) return setErr('Укажите название по-русски')
    setBusy(true)
    const sb = supabase!
    try {
      let coverPath = coverRemoved ? null : cover
      const oldCover = cover
      if (pending) {
        coverPath = `collections/${cid}/${crypto.randomUUID()}.webp`
        const up = await sb.storage.from('media').upload(coverPath, pending.blob, { contentType: 'image/webp' })
        if (up.error) throw up.error
      }
      const base = { id: cid, name_ru: f.name_ru.trim(), name_kk: f.name_kk.trim(), description_ru: f.description_ru.trim(), description_kk: f.description_kk.trim(), is_public: f.is_public, cover_path: coverPath }
      let slug = f.slug || slugify(f.name_ru)
      let { error } = await sb.from('collections').upsert({ ...base, slug }, { onConflict: 'id' })
      if (error && isDuplicate(error)) { slug = `${slug}-${randSuffix()}`.slice(0, 60); ({ error } = await sb.from('collections').upsert({ ...base, slug }, { onConflict: 'id' })) }
      if (error) throw error
      if (oldCover && oldCover !== coverPath) await sb.storage.from('media').remove([oldCover])
      const removed = [...orig].filter((x) => !sel.has(x)), added = [...sel].filter((x) => !orig.has(x))
      if (removed.length) { const r = await sb.from('collection_products').delete().eq('collection_id', cid).in('product_id', removed); if (r.error) throw r.error }
      if (added.length) { const r = await sb.from('collection_products').insert(added.map((p, i) => ({ collection_id: cid, product_id: p, sort_order: orig.size + i }))); if (r.error) throw r.error }
      setOrig(new Set(sel)); setCover(coverPath); setPending(null); setCoverRemoved(false); setExists(true); setF((p) => ({ ...p, slug }))
      setOk('Коллекция сохранена')
      if (!id) navigate(`/admin/collections/${cid}`, { replace: true })
    } catch (x) { setErr(errText(x)) } finally { setBusy(false) }
  }

  if (loading) return <p className="pt-12 text-center">Загрузка…</p>
  const shown = pending?.preview ?? (!coverRemoved && cover ? mediaUrl(cover) : null)
  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-32">
      <Link to="/admin/collections" className="text-xs uppercase tracking-widest">← Все коллекции</Link>
      <h1 className="text-4xl mt-4 mb-6">{exists ? 'Изменить коллекцию' : 'Новая коллекция'}</h1>
      <label className="block text-sm mb-4">Название (по-русски) *<input className={inp} value={f.name_ru} maxLength={80} onChange={(e) => setF({ ...f, name_ru: e.target.value })} /></label>
      <label className="block text-sm mb-4">Атауы (қазақша)<input className={inp} value={f.name_kk} maxLength={80} onChange={(e) => setF({ ...f, name_kk: e.target.value })} /></label>
      <label className="block text-sm mb-4">Описание (по-русски)<textarea className={inp} rows={2} value={f.description_ru} maxLength={1000} onChange={(e) => setF({ ...f, description_ru: e.target.value })} /></label>
      <label className="block text-sm mb-6">Сипаттама (қазақша)<textarea className={inp} rows={2} value={f.description_kk} maxLength={1000} onChange={(e) => setF({ ...f, description_kk: e.target.value })} /></label>
      <div className="mb-6">
        <p className="text-sm mb-2">Обложка (необязательно)</p>
        {shown && <img src={shown} alt="Обложка" className="h-32 w-auto mb-3" />}
        <div className="flex gap-3"><label className={`${btn} cursor-pointer`}>{shown ? 'Заменить' : 'Загрузить'}<input type="file" accept="image/*" onChange={onCover} className="sr-only" /></label>
          {shown && <button onClick={() => { setPending(null); setCoverRemoved(true) }} className={`${btn} border-red-800 text-red-800`}>Убрать</button>}</div>
      </div>
      <h2 className="text-2xl mb-2">Товары в коллекции</h2>
      {prods.length === 0 ? <p className="text-sm mb-6">Товаров пока нет.</p> : (
        <ul className="border border-beige divide-y divide-beige max-h-80 overflow-y-auto mb-6">{prods.map((p) => (
          <li key={p.id}><label className="flex items-center gap-3 px-3 py-3"><input type="checkbox" checked={sel.has(p.id)} onChange={() => toggle(p.id)} /><span>{p.name_ru}</span>{p.status !== 'published' && <span className="text-xs text-charcoal/60">(черновик)</span>}</label></li>))}
        </ul>)}
      <p className="text-xs mb-4">Черновики в коллекции на сайте не видны, пока не опубликованы.</p>
      <label className="flex items-center gap-3 text-sm mb-6"><input type="checkbox" checked={f.is_public} onChange={(e) => setF({ ...f, is_public: e.target.checked })} />Показывать коллекцию на сайте</label>
      {err && <p role="alert" className="text-red-800 mb-3">{err}</p>}{ok && <p role="status" className="mb-3">{ok}</p>}
      <button disabled={busy} onClick={save} className="bg-ink text-ivory px-6 py-3 text-xs uppercase tracking-widest disabled:opacity-50">{busy ? 'Сохранение…' : 'Сохранить'}</button>
    </div>
  )
}
