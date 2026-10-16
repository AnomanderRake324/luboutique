import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { errText } from './utils'

interface P { id: string; name_ru: string; is_featured: boolean; is_new: boolean }

export default function HomeAdmin() {
  const [ps, setPs] = useState<P[] | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    void supabase!.from('products').select('id,name_ru,is_featured,is_new').eq('status', 'published').order('created_at', { ascending: false }).then(({ data, error }) => { if (error) setErr(errText(error)); else setPs(data as P[]) })
  }, [])
  async function flip(p: P, k: 'is_featured' | 'is_new') {
    setErr('')
    const { error } = await supabase!.from('products').update({ [k]: !p[k] }).eq('id', p.id)
    if (error) setErr(errText(error)); else setPs((cur) => cur!.map((x) => (x.id === p.id ? { ...x, [k]: !p[k] } : x)))
  }
  return (
    <div className="max-w-3xl mx-auto px-5 pt-8 pb-20">
      <h1 className="text-4xl mb-4">Главная страница</h1>
      <ul className="text-sm mb-8 grid gap-1 list-disc pl-5">
        <li><Link to="/admin/banners" className="underline">Баннеры</Link>: главный баннер вверху и промо-блоки под товарами.</li>
        <li><Link to="/admin/collections" className="underline">Коллекции</Link>: отдельная страница «Коллекции».</li>
        <li>Ниже — какие опубликованные товары показывать в «Избранном» и «Новинках» (до 4 в каждом блоке).</li>
      </ul>
      {err && <p role="alert" className="text-red-800 mb-4">{err}</p>}
      {ps === null ? <p>Загрузка…</p> : ps.length === 0 ? <p>Опубликованных товаров пока нет.</p> : (
        <ul className="border border-beige divide-y divide-beige">{ps.map((p) => (
          <li key={p.id} className="px-3 py-3"><p className="mb-2">{p.name_ru}</p>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_featured} onChange={() => flip(p, 'is_featured')} />Избранное</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={p.is_new} onChange={() => flip(p, 'is_new')} />Новинка</label>
            </div></li>))}
        </ul>)}
    </div>
  )
}
