// Проверка прав доступа от лица АНОНИМНОГО посетителя (использует только публичный ключ).
// Запуск: npm run check:security   (читает .env.local)
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './env.mjs'

const env = loadEnv()
const url = env.VITE_SUPABASE_URL, key = env.VITE_SUPABASE_ANON_KEY
if (!url || !key) { console.error('Нет VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (.env.local)'); process.exit(2) }
const sb = createClient(url, key, { auth: { persistSession: false } })

// Если Supabase недоступен, результаты проверок были бы обманчивыми — останавливаемся.
try { const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: key } }); if (r.status >= 500) throw new Error('HTTP ' + r.status) }
catch (e) { console.error('Не удалось связаться с Supabase (' + e.message + '). Проверьте интернет и что проект не на паузе.'); process.exit(2) }

let failed = 0
async function check(name, fn) {
  try { const r = await fn(); if (r === true) console.log('  OK   ', name); else { failed++; console.log('  FAIL ', name, '→', r) } }
  catch (e) { failed++; console.log('  FAIL ', name, '→', e.message) }
}
const blocked = (res) => (res.error ? true : 'запись прошла без ошибки — проверьте миграцию 0002')
const zero = '00000000-0000-0000-0000-000000000000'

console.log('Проверка как анонимный посетитель:', url)
await check('видны только опубликованные товары', async () => { const { data, error } = await sb.from('products').select('status'); if (error) return error.message; return data.every((r) => r.status === 'published') || 'виден неопубликованный товар' })
await check('видны только опубликованные баннеры', async () => { const { data, error } = await sb.from('banners').select('status'); if (error) return error.message; return data.every((r) => r.status === 'published') || 'виден черновик баннера' })
await check('видны только публичные коллекции', async () => { const { data, error } = await sb.from('collections').select('is_public'); if (error) return error.message; return data.every((r) => r.is_public) || 'видна скрытая коллекция' })
await check('настройки магазина читаются (публичные)', async () => { const { data, error } = await sb.from('store_settings').select('whatsapp_number').maybeSingle(); return error ? error.message : !!data || 'строка настроек не найдена' })
await check('список администраторов недоступен', async () => { const { data, error } = await sb.from('admins').select('user_id'); return !!error || (data ?? []).length === 0 || 'список администраторов виден!' })
await check('приватные настройки недоступны', async () => { const { data, error } = await sb.from('private_settings').select('key'); return !!error || (data ?? []).length === 0 || 'приватные настройки видны!' })
for (const t of ['products', 'product_images', 'categories', 'collections', 'collection_products', 'banners', 'store_settings']) {
  await check(`запрещено создавать записи: ${t}`, async () => blocked(await sb.from(t).insert({})))
  await check(`запрещено менять записи: ${t}`, async () => blocked(await sb.from(t).update({ updated_at: new Date().toISOString() }).eq('id', t === 'store_settings' ? true : zero)))
  await check(`запрещено удалять записи: ${t}`, async () => blocked(await sb.from(t).delete().eq('id', t === 'store_settings' ? true : zero)))
}
await check('is_admin() для анонима = false', async () => { const { data, error } = await sb.rpc('is_admin'); return error ? error.message : data === false || 'is_admin вернул не false' })
await check('загрузка файла в хранилище запрещена', async () => {
  const path = `security-check/${Date.now()}.webp`
  const { error } = await sb.storage.from('media').upload(path, new Blob(['x'], { type: 'image/webp' }))
  if (error) return true
  await sb.storage.from('media').remove([path]); return `файл ${path} загрузился! Удалите его в Supabase → Storage и проверьте миграцию 0003`
})
await check('удаление файлов из хранилища запрещено', async () => { const { data } = await sb.storage.from('media').remove(['security-check/nonexistent.webp']); return (data ?? []).length === 0 || 'удаление вернуло данные' })
await check('список файлов хранилища не отдаётся анониму', async () => { const { data, error } = await sb.storage.from('media').list('products'); return !!error || (data ?? []).length === 0 || 'список файлов виден' })

console.log(failed ? `\nПРОВАЛЕНО проверок: ${failed}` : '\nВсе проверки пройдены')
process.exit(failed ? 1 : 0)
