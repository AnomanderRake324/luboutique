import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { errText } from './utils'

interface Row { id: string; name_ru: string; is_public: boolean; cover_path: string | null }
const btn = 'border border-ink px-3 py-2 text-xs uppercase tracking-widest'

export default function CollectionList() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase!.from('collections').select('id,name_ru,is_public,cover_path').order('sort_order').order('created_at')
    if (error) setErr(errText(error)); else { setErr(''); setRows(data as Row[]) }
  }, [])
  useEffect(() => { void load() }, [load])
  async function toggle(r: Row) {
    const { error } = await supabase!.from('collections').update({ is_public: !r.is_public }).eq('id', r.id)
    if (error) setErr(errText(error)); else await load()
  }
  async function del(r: Row) {
    if (!window.confirm(`Удалить коллекцию «${r.name_ru}»? Товары останутся.`)) return
    if (r.cover_path) await supabase!.storage.from('media').remove([r.cover_path])
    const { error } = await supabase!.from('collections').delete().eq('id', r.id)
    if (error) setErr(errText(error)); else await load()
  }
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-20">
      <div className="flex items-center justify-between mb-6"><h1 className="text-4xl">Коллекции</h1><Link to="/admin/collections/new" className="bg-ink text-ivory px-5 py-3 text-xs uppercase tracking-widest">+ Создать</Link></div>
      {err && <p role="alert" className="text-red-800 mb-4">{err}</p>}
      {rows === null ? <p>Загрузка…</p> : rows.length === 0 ? <p>Коллекций пока нет.</p> : (
        <ul className="grid gap-3">{rows.map((r) => (
          <li key={r.id} className="border border-beige p-3">
            <p className="font-serif text-xl">{r.name_ru}</p><p className="text-sm">{r.is_public ? 'Показывается на сайте' : 'Скрыта'}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link to={`/admin/collections/${r.id}`} className={btn}>Изменить</Link>
              <button onClick={() => toggle(r)} className={btn}>{r.is_public ? 'Скрыть' : 'Показать'}</button>
              <button onClick={() => del(r)} className={`${btn} border-red-800 text-red-800`}>Удалить</button>
            </div>
          </li>))}
        </ul>)}
    </div>
  )
}
