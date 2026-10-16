import { strict as assert } from 'node:assert'
import { matchRoutes, type RouteObject } from 'react-router-dom'

// Структура путей повторяет src/App.tsx (только пути, без компонентов).
const pages = ['catalog', 'product/:slug', 'collections', 'contacts', '*']
const OLD: RouteObject[] = [
  { path: '/admin/*' },
  { path: '/:lang', children: [{ index: true }, ...pages.map((path) => ({ path }))] },
]
const NEW: RouteObject[] = [
  { path: '/admin/*' },
  ...['ru', 'kk'].map((l) => ({ path: `/${l}`, children: [{ index: true }, ...pages.map((path) => ({ path }))] })),
  { path: '*' },
]
const first = (routes: RouteObject[], url: string) => matchRoutes(routes, url)?.[0].route.path

// Старая схема действительно уводила админку на витрину
assert.equal(first(OLD, '/admin/collections'), '/:lang', 'воспроизведена ошибка старой схемы')
// Новая схема: все разделы админки остаются в админке
for (const p of ['/admin', '/admin/collections', '/admin/collections/new', '/admin/collections/abc', '/admin/categories', '/admin/banners', '/admin/banners/new', '/admin/products/new', '/admin/settings', '/admin/home'])
  assert.equal(first(NEW, p), '/admin/*', p)
// Витрина на обоих языках
for (const l of ['ru', 'kk']) for (const p of ['', '/catalog', '/collections', '/contacts', '/product/x'])
  assert.equal(first(NEW, `/${l}${p}`), `/${l}`, `/${l}${p}`)
// Неизвестный язык/путь попадает в запасной маршрут
assert.equal(first(NEW, '/xx/catalog'), '*')
console.log('route tests passed')
