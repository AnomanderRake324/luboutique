// Генерирует public/sitemap.xml и robots.txt перед сборкой. Сбой сети не ломает сборку.
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './env.mjs'

const env = loadEnv()
const site = (env.VITE_SITE_URL || '').replace(/\/$/, '')
if (!site) { console.log('[sitemap] VITE_SITE_URL не задан — sitemap пропущен'); process.exit(0) }

const pages = ['', '/catalog', '/collections', '/contacts']
let slugs = []
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
  try {
    const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
    const { data, error } = await sb.from('products').select('slug, updated_at').eq('status', 'published')
    if (error) throw error
    slugs = data
  } catch (e) { console.log('[sitemap] товары не загружены, в sitemap только основные страницы:', e.message) }
}
const alt = (path) => ['ru', 'kk'].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${site}/${l}${path}"/>`).join('')
const entry = (path, lastmod) => ['ru', 'kk'].map((l) => `<url><loc>${site}/${l}${path}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}${alt(path)}</url>`).join('\n')
const body = [...pages.map((p) => entry(p)), ...slugs.map((s) => entry(`/product/${s.slug}`, s.updated_at))].join('\n')
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`)
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n`)
console.log(`[sitemap] записано URL: ${(pages.length + slugs.length) * 2}`)
