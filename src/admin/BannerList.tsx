import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { errText } from './utils'
import { TEMPLATES, type Tpl } from './bannerTemplates'

interface Row { id: string; template: Tpl; headline_ru: string; placement: 'hero' | 'promo'; status: 'draft' | 'published' }
const btn = 'border border-ink px-3 py-2 text-xs uppercase tracking-widest'

export default function BannerList() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase!.from('banners').select('id,template,headline_ru,placement,status').order('created_at', { ascending: false })
    if (error) setErr(errText(error)); else { setErr(''); setRows(data as Row[]) }
  }, [])
  useEffect(() => { void load() }, [load])
  async function toggle(r: Row) {
    const { error } = await supabase!.from('banners').update({ status: r.status === 'published' ? 'draft' : 'published' }).eq('id', r.id)
    if (error) setErr(errText(error)); else await load()
  }
  async function del(r: Row) {
    if (!window.confirm(`Удалить баннер «${r.headline_ru}»?`)) return
    const { error } = await supabase!.from('banners').delete().eq('id', r.id)
    if (error) setErr(errText(error)); else await load()
  }
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-20">
      <div className="flex items-center justify-between mb-6"><h1 className="text-4xl">Баннеры</h1><Link to="/admin/banners/new" className="bg-ink text-ivory px-5 py-3 text-xs uppercase tracking-widest">+ Создать</Link></div>
      <p className="text-sm mb-6">«Главный» баннер показывается вверху главной страницы (если опубликовано несколько — последний изменённый). «Промо» баннеры идут блоками под товарами.</p>
      {err && <p role="alert" className="text-red-800 mb-4">{err}</p>}
      {rows === null ? <p>Загрузка…</p> : rows.length === 0 ? <p>Баннеров пока нет.</p> : (
        <ul className="grid gap-3">{rows.map((r) => (
          <li key={r.id} className="border border-beige p-3">
            <p className="font-serif text-xl">{r.headline_ru || '(без заголовка)'}</p>
            <p className="text-sm">{TEMPLATES[r.template]?.label} · {r.placement === 'hero' ? 'Главный' : 'Промо'} · {r.status === 'published' ? 'Опубликован' : 'Черновик'}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link to={`/admin/banners/${r.id}`} className={btn}>Изменить</Link>
              <button onClick={() => toggle(r)} className={btn}>{r.status === 'published' ? 'Снять' : 'Опубликовать'}</button>
              <button onClick={() => del(r)} className={`${btn} border-red-800 text-red-800`}>Удалить</button>
            </div>
          </li>))}
        </ul>
      )}
    </div>
  )
}
