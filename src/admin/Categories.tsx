import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { errText, isDuplicate, randSuffix, slugify } from './utils'

interface Cat { id: string; slug: string; name_ru: string; name_kk: string }
const inp = 'border border-beige bg-ivory px-3 py-2 w-full'
const btn = 'border border-ink px-3 py-2 text-xs uppercase tracking-widest'

export default function Categories() {
  const [cats, setCats] = useState<Cat[]>([])
  const [ru, setRu] = useState(''), [kk, setKk] = useState('')
  const [err, setErr] = useState(''), [ok, setOk] = useState('')
  const load = useCallback(async () => {
    const { data, error } = await supabase!.from('categories').select('*').order('sort_order').order('created_at')
    if (error) setErr(errText(error)); else setCats(data as Cat[])
  }, [])
  useEffect(() => { void load() }, [load])

  async function add() {
    setErr(''); setOk('')
    if (!ru.trim()) return setErr('Введите название по-русски')
    let slug = slugify(ru)
    let { error } = await supabase!.from('categories').insert({ slug, name_ru: ru.trim(), name_kk: kk.trim(), sort_order: cats.length })
    if (error && isDuplicate(error)) { slug += '-' + randSuffix(); ({ error } = await supabase!.from('categories').insert({ slug, name_ru: ru.trim(), name_kk: kk.trim(), sort_order: cats.length })) }
    if (error) return setErr(errText(error))
    setRu(''); setKk(''); setOk('Категория добавлена'); await load()
  }
  async function save(c: Cat) {
    setErr(''); setOk('')
    const { error } = await supabase!.from('categories').update({ name_ru: c.name_ru.trim(), name_kk: c.name_kk.trim() }).eq('id', c.id)
    if (error) setErr(errText(error)); else setOk('Сохранено')
  }
  async function del(c: Cat) {
    if (!window.confirm(`Удалить категорию «${c.name_ru}»? Товары останутся, но без категории.`)) return
    const { error } = await supabase!.from('categories').delete().eq('id', c.id)
    if (error) setErr(errText(error)); else await load()
  }
  const edit = (id: string, k: 'name_ru' | 'name_kk', v: string) => setCats(cats.map((c) => (c.id === id ? { ...c, [k]: v } : c)))

  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-20">
      <h1 className="text-4xl mb-6">Категории</h1>
      {err && <p role="alert" className="text-red-800 mb-4">{err}</p>}
      {ok && <p role="status" className="mb-4">{ok}</p>}
      <ul className="grid gap-4 mb-10">
        {cats.map((c) => (
          <li key={c.id} className="border border-beige p-3 grid gap-2">
            <label className="text-sm">По-русски<input className={inp} value={c.name_ru} onChange={(e) => edit(c.id, 'name_ru', e.target.value)} /></label>
            <label className="text-sm">Қазақша<input className={inp} value={c.name_kk} onChange={(e) => edit(c.id, 'name_kk', e.target.value)} /></label>
            <div className="flex gap-2"><button onClick={() => save(c)} className={btn}>Сохранить</button><button onClick={() => del(c)} className={`${btn} border-red-800 text-red-800`}>Удалить</button></div>
          </li>
        ))}
        {cats.length === 0 && <li>Категорий пока нет.</li>}
      </ul>
      <h2 className="text-2xl mb-3">Новая категория</h2>
      <div className="grid gap-2">
        <label className="text-sm">По-русски<input className={inp} value={ru} onChange={(e) => setRu(e.target.value)} /></label>
        <label className="text-sm">Қазақша<input className={inp} value={kk} onChange={(e) => setKk(e.target.value)} /></label>
        <button onClick={add} className="bg-ink text-ivory px-5 py-3 text-xs uppercase tracking-widest w-fit">Добавить</button>
      </div>
    </div>
  )
}
