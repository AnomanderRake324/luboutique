import { supabase, mediaUrl } from './supabase'
import { CATEGORIES, COLLECTIONS, PRODUCTS } from './demo'
import { STORE } from './store'
import { parseStyle } from './banner'
import type { Banner, CatalogData, Product, StockStatus } from './types'

interface ProductRow {
  id: string; slug: string; name_ru: string; name_kk: string; description_ru: string; description_kk: string
  category_id: string | null; price_kzt: number; sizes: string[]; colors: string[]; stock_status: StockStatus
  is_featured: boolean; is_new: boolean
  product_images: { storage_path: string; sort_order: number; is_cover: boolean }[]
  collection_products: { collection_id: string }[]
}
const TONES = ['#e8dfcc', '#cbbfa5']

const demo: CatalogData = {
  banners: [], products: PRODUCTS, categories: CATEGORIES, collections: COLLECTIONS, isDemo: true,
  settings: { name: STORE.name, logo: null, tiktok: '', whatsapp: STORE.whatsapp, phone: STORE.phoneDisplay, address: STORE.address, instagram: STORE.instagram },
}

export async function loadCatalog(): Promise<CatalogData> {
  if (!supabase) return demo
  const [p, c, col, s, bn] = await Promise.all([
    supabase.from('products').select('*, product_images(storage_path,sort_order,is_cover), collection_products(collection_id)').eq('status', 'published').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('collections').select('*').eq('is_public', true).order('sort_order'),
    supabase.from('store_settings').select('*').maybeSingle(),
    supabase.from('banners').select('*').eq('status', 'published').order('sort_order').order('updated_at', { ascending: false }),
  ])
  const err = p.error ?? c.error ?? col.error ?? s.error ?? bn.error
  if (err) throw err

  const products: Product[] = ((p.data ?? []) as ProductRow[]).map((r) => ({
    id: r.id, slug: r.slug,
    name: { ru: r.name_ru, kk: r.name_kk }, description: { ru: r.description_ru, kk: r.description_kk },
    categoryId: r.category_id, price: r.price_kzt, sizes: r.sizes, colors: r.colors, stockStatus: r.stock_status,
    featured: r.is_featured, isNew: r.is_new, tones: TONES, isDemo: false,
    images: [...r.product_images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order).map((i) => mediaUrl(i.storage_path)),
    collectionIds: r.collection_products.map((x) => x.collection_id),
  }))
  const st = s.data
  return {
    isDemo: false, products,
    banners: (bn.data ?? []).map((x): Banner => ({ id: x.id, template: x.template, headline: { ru: x.headline_ru, kk: x.headline_kk }, subtitle: { ru: x.subtitle_ru, kk: x.subtitle_kk }, image: x.image_path ? mediaUrl(x.image_path) : null, align: x.text_align, style: parseStyle(x.style), link: x.link_path, placement: x.placement })),
    categories: (c.data ?? []).map((x) => ({ id: x.id, name: { ru: x.name_ru, kk: x.name_kk } })),
    collections: (col.data ?? []).map((x) => ({ id: x.id, slug: x.slug, name: { ru: x.name_ru, kk: x.name_kk }, blurb: { ru: x.description_ru, kk: x.description_kk }, cover: x.cover_path ? mediaUrl(x.cover_path) : null, tone: '#d9cdb6' })),
    settings: st
      ? { name: st.store_name, logo: st.logo_path ? mediaUrl(st.logo_path) : null, tiktok: st.tiktok_url ?? '', whatsapp: st.whatsapp_number, phone: st.phone_display, address: { ru: st.address_ru, kk: st.address_kk }, instagram: st.instagram_url }
      : demo.settings,
  }
}
