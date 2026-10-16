import { useEffect, useState, type ChangeEvent } from 'react'
import { supabase, mediaUrl } from '../lib/supabase'
import { errText, isHttpsUrl, normalizePhone, optimizeImage } from './utils'

interface S { store_name: string; logo_path: string | null; whatsapp_number: string; phone_display: string; address_ru: string; address_kk: string; instagram_url: string; tiktok_url: string }
const inp = 'border border-beige bg-ivory px-3 py-3 w-full mt-1'

export default function Settings() {
  const [s, setS] = useState<S | null>(null)
  const [wa, setWa] = useState('')
  const [err, setErr] = useState(''), [ok, setOk] = useState(''), [busy, setBusy] = useState(false)
  useEffect(() => {
    void supabase!.from('store_settings').select('*').maybeSingle().then(({ data, error }) => {
      if (error || !data) return setErr(error ? errText(error) : 'Настройки не найдены. Проверьте миграцию 0001.')
      setS(data as S); setWa(data.whatsapp_number ? '+' + data.whatsapp_number : '')
    })
  }, [])
  if (!s) return <p className="pt-12 text-center">{err || 'Загрузка…'}</p>
  const set = <K extends keyof S>(k: K, v: S[K]) => setS({ ...s, [k]: v })

  async function logo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setErr(''); setOk(''); setBusy(true)
    try {
      const blob = await optimizeImage(file)
      const path = `settings/logo-${crypto.randomUUID()}.webp`
      const up = await supabase!.storage.from('media').upload(path, blob, { contentType: 'image/webp' })
      if (up.error) throw up.error
      const old = s!.logo_path
      const { error } = await supabase!.from('store_settings').update({ logo_path: path }).eq('id', true)
      if (error) throw error
      if (old) await supabase!.storage.from('media').remove([old])
      set('logo_path', path); setOk('Логотип загружен')
    } catch (x) { setErr(errText(x)) } finally { setBusy(false) }
  }
  async function removeLogo() {
    if (!s!.logo_path) return
    setBusy(true)
    const { error } = await supabase!.from('store_settings').update({ logo_path: null }).eq('id', true)
    if (error) setErr(errText(error)); else { await supabase!.storage.from('media').remove([s!.logo_path!]); set('logo_path', null); setOk('Логотип удалён') }
    setBusy(false)
  }
  async function backup() {
    setErr(''); setOk(''); setBusy(true)
    try {
      const tables = ['categories', 'products', 'product_images', 'collections', 'collection_products', 'banners', 'store_settings']
      const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), note: 'Файлы фотографий здесь не хранятся: они лежат в Supabase Storage (бакет media). В таблицах указаны пути к ним.' }
      for (const t of tables) { const { data, error } = await supabase!.from(t).select('*'); if (error) throw error; out[t] = data }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `boutique-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      setOk('Копия данных скачана')
    } catch (x) { setErr(errText(x)) } finally { setBusy(false) }
  }
  async function save() {
    setErr(''); setOk('')
    const num = wa.trim() ? normalizePhone(wa) : ''
    if (num === null) return setErr('Номер WhatsApp указан неверно. Пример: +7 777 705 1100')
    if (!s!.store_name.trim()) return setErr('Укажите название магазина')
    for (const [label, v] of [['Instagram', s!.instagram_url], ['TikTok', s!.tiktok_url]] as const)
      if (v.trim() && !isHttpsUrl(v.trim())) return setErr(`${label}: ссылка должна начинаться с https://`)
    setBusy(true)
    const { error } = await supabase!.from('store_settings').update({
      store_name: s!.store_name.trim(), whatsapp_number: num, phone_display: s!.phone_display.trim(),
      address_ru: s!.address_ru.trim(), address_kk: s!.address_kk.trim(), instagram_url: s!.instagram_url.trim(), tiktok_url: s!.tiktok_url.trim(),
    }).eq('id', true)
    setBusy(false)
    if (error) setErr(errText(error)); else { setWa(num ? '+' + num : ''); setOk('Настройки сохранены') }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-8 pb-24">
      <h1 className="text-4xl mb-6">Настройки магазина</h1>
      <label className="block text-sm mb-4">Название магазина<input className={inp} value={s.store_name} onChange={(e) => set('store_name', e.target.value)} maxLength={80} /></label>
      <div className="mb-6">
        <p className="text-sm mb-2">Логотип</p>
        {s.logo_path && <img src={mediaUrl(s.logo_path)} alt="Логотип" className="h-16 w-auto mb-3 bg-cream p-2" />}
        <div className="flex gap-3">
          <label className="border border-ink px-4 py-3 text-xs uppercase tracking-widest cursor-pointer">{s.logo_path ? 'Заменить' : 'Загрузить'}<input type="file" accept="image/*" onChange={logo} disabled={busy} className="sr-only" /></label>
          {s.logo_path && <button onClick={removeLogo} disabled={busy} className="border border-red-800 text-red-800 px-4 py-3 text-xs uppercase tracking-widest">Удалить</button>}
        </div>
      </div>
      <label className="block text-sm mb-1">Номер WhatsApp для заказов<input className={inp} inputMode="tel" placeholder="+7 777 705 1100" value={wa} onChange={(e) => setWa(e.target.value)} /></label>
      <p className="text-xs mb-4">Сюда будут приходить сообщения от покупателей. Если оставить пустым, кнопка заказа не сработает.</p>
      <label className="block text-sm mb-4">Телефон на сайте<input className={inp} value={s.phone_display} onChange={(e) => set('phone_display', e.target.value)} maxLength={40} /></label>
      <label className="block text-sm mb-4">Адрес (по-русски)<textarea className={inp} rows={2} value={s.address_ru} onChange={(e) => set('address_ru', e.target.value)} /></label>
      <label className="block text-sm mb-4">Мекенжай (қазақша)<textarea className={inp} rows={2} value={s.address_kk} onChange={(e) => set('address_kk', e.target.value)} /></label>
      <label className="block text-sm mb-4">Instagram (ссылка)<input className={inp} value={s.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://www.instagram.com/…" /></label>
      <label className="block text-sm mb-6">TikTok (ссылка)<input className={inp} value={s.tiktok_url} onChange={(e) => set('tiktok_url', e.target.value)} placeholder="https://www.tiktok.com/@…" /></label>
      {err && <p role="alert" className="text-red-800 mb-3">{err}</p>}
      {ok && <p role="status" className="mb-3">{ok}</p>}
      <button onClick={save} disabled={busy} className="bg-ink text-ivory px-6 py-3 text-xs uppercase tracking-widest disabled:opacity-50">Сохранить</button>
      <div className="mt-12 border-t border-beige pt-6">
        <h2 className="text-2xl mb-2">Резервная копия</h2>
        <p className="text-sm mb-3">На бесплатном тарифе Supabase автоматических копий нет. Скачивайте копию данных (товары, категории, коллекции, баннеры, настройки) раз в неделю и после больших изменений. Фотографии в файл не входят, они остаются в хранилище Supabase.</p>
        <button onClick={backup} disabled={busy} className="border border-ink px-5 py-3 text-xs uppercase tracking-widest disabled:opacity-50">Скачать копию данных</button>
      </div>
    </div>
  )
}
