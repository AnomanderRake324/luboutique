import type { Localized } from './i18n'
export type StockStatus = 'in_stock' | 'low' | 'out'
export interface Product {
  id: string; slug: string; name: Localized; description: Localized
  categoryId: string | null; price: number; sizes: string[]; colors: string[]
  stockStatus: StockStatus; featured: boolean; isNew: boolean
  images: string[]; tones: string[]; collectionIds: string[]; isDemo: boolean
}
export interface Category { id: string; name: Localized }
export interface Collection { id: string; slug: string; name: Localized; blurb: Localized; cover: string | null; tone: string }
export interface Settings { name: string; logo: string | null; whatsapp: string; phone: string; address: Localized; instagram: string; tiktok: string }
export type Align = 'left' | 'center' | 'right'
export interface BannerStyle { color: 'light' | 'dark'; overlay: number; font: 'serif' | 'sans' }
export interface Banner { id: string; template: string; headline: Localized; subtitle: Localized; image: string | null; align: Align; style: BannerStyle; link: string | null; placement: 'hero' | 'promo' }
export interface CatalogData { banners: Banner[]; products: Product[]; categories: Category[]; collections: Collection[]; settings: Settings; isDemo: boolean }
