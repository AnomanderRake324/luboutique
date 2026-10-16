import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, mediaUrl } from '../lib/supabase'
import { formatKZT } from '../lib/i18n'
import { errText } from './utils'

interface Row { id: string; name_ru: string; price_kzt: number; status: 'draft' | 'published' | 'archived'; product_images: { storage_path: string; is_cover: boolean }[] }
const LABEL = { draft: 'Черновик', published: 'Опубликован', archived: 'В архиве' } as const
const TABS = [['all', 'Все'], ['published', 'Опубликованные'], ['draft', 'Черновики'], ['archived', 'Архив']] as const
const btn = 'border border-ink px-3 py-2 text-xs uppercase tracking-widest'

export default function ProductList() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [tab, setTab] = useState<string>('all')
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase!.from('products').select('id,name_ru,price_kzt,status,product_images(storage_path,is_cover)').order('created_at', { ascending: false })
    if (error) setErr(errText(error)); else { setErr(''); setRows(data as Row[]) }
  }, [])
  useEffect(() => { void load() }, [load])

  async function setStatus(id: string, status: Row['status']) {
    const { error } = await supabase!.from('products').update({ status }).eq('id', id)
    if (error) setErr(errText(error)); else await load()
  }
  async function remove(r: Row) {
    if (!window.confirm(`Удалить «${r.name_ru}» вместе с фотографиями? Это нельзя отменить.`)) return
    const paths = r.product_images.map((i) => i.storage_path)
    if (paths.length) await supabase!.storage.from('media').remove(paths)
    const { error } = await supabase!.from('products').delete().eq('id', r.id)
    if (error) setErr(errText(error)); else await load()
  }

  const list = (rows ?? []).filter((r) => tab === 'all' || r.status === tab)
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl">Товары</h1>
        <Link to="/admin/products/new" className="bg-ink text-ivory px-5 py-3 text-xs uppercase tracking-widest">+ Добавить</Link>
      </div>
      <div className="flex gap-2 overflow-x-auto mb-6" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`${btn} shrink-0 ${tab === k ? 'bg-ink text-ivory' : ''}`}>{l}</button>)}
      </div>
      {err && <p role="alert" className="text-red-800 mb-4">{err}</p>}
      {rows === null ? <p>Загрузка…</p> : list.length === 0 ? <p>Здесь пока пусто.</p> : (
        <ul className="grid gap-4">
          {list.map((r) => {
            const cover = r.product_images.find((i) => i.is_cover) ?? r.product_images[0]
            return (
              <li key={r.id} className="border border-beige p-3 flex gap-3">
                <div className="w-20 h-28 bg-cream shrink-0">{cover && <img src={mediaUrl(cover.storage_path)} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-xl truncate">{r.name_ru}</p>
                  <p className="text-sm">{formatKZT(r.price_kzt)} · {LABEL[r.status]}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link to={`/admin/products/${r.id}`} className={btn}>Изменить</Link>
                    {r.status !== 'published' && <button onClick={() => setStatus(r.id, 'published')} className={btn}>Опубликовать</button>}
                    {r.status === 'published' && <button onClick={() => setStatus(r.id, 'draft')} className={btn}>Снять</button>}
                    {r.status !== 'archived' && <button onClick={() => setStatus(r.id, 'archived')} className={btn}>В архив</button>}
                    <button onClick={() => remove(r)} className={`${btn} border-red-800 text-red-800`}>Удалить</button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
