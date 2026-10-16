import type { Align, BannerStyle } from '../lib/types'

export type Tpl = 'new_collection' | 'new_arrivals' | 'seasonal_sale' | 'special_offer'
interface Def { label: string; ru: [string, string]; kk: [string, string]; align: Align; style: BannerStyle }

// Казахские тексты — черновик, требуют проверки. Скидки и проценты владелица вводит сама.
export const TEMPLATES: Record<Tpl, Def> = {
  new_collection: { label: 'Новая коллекция', ru: ['Новая коллекция', 'Уже в бутике'], kk: ['Жаңа коллекция', 'Бутикте қазір бар'], align: 'left', style: { color: 'light', overlay: 30, font: 'serif' } },
  new_arrivals: { label: 'Новые поступления', ru: ['Новые поступления', 'Загляните в каталог'], kk: ['Жаңа түсімдер', 'Каталогты қараңыз'], align: 'center', style: { color: 'light', overlay: 25, font: 'serif' } },
  seasonal_sale: { label: 'Сезонная распродажа', ru: ['Сезонная распродажа', 'Условия уточняйте в бутике'], kk: ['Маусымдық жеңілдіктер', 'Шарттарын бутиктен біліңіз'], align: 'center', style: { color: 'light', overlay: 45, font: 'sans' } },
  special_offer: { label: 'Специальное предложение', ru: ['Специальное предложение', 'Подробности — в бутике'], kk: ['Арнайы ұсыныс', 'Толығырақ — бутикте'], align: 'right', style: { color: 'dark', overlay: 35, font: 'serif' } },
}
export const TPL_KEYS = Object.keys(TEMPLATES) as Tpl[]
export const isTemplateText = (ru: string) => ru === '' || TPL_KEYS.some((k) => TEMPLATES[k].ru[0] === ru)

export const FORMATS = [
  { id: 'square', label: 'Квадрат 1080×1080 (пост)', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Вертикальный 1080×1350 (пост)', w: 1080, h: 1350 },
  { id: 'story', label: 'Stories 1080×1920', w: 1080, h: 1920 },
] as const

interface RenderOpts { imageUrl: string | null; headline: string; subtitle: string; align: Align; style: BannerStyle; storeName: string; w: number; h: number }

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  let cur = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${word}` : word
    if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = word } else cur = next
  }
  if (cur) lines.push(cur)
  return lines
}

// Рисует финальную картинку для соцсетей из реальной загруженной фотографии. Ничего не генерируется.
export async function renderBannerPng(o: RenderOpts): Promise<Blob> {
  const serif = o.style.font === 'serif'
  const family = serif ? '"Cormorant Garamond", Georgia, serif' : 'Inter, system-ui, sans-serif'
  try { await Promise.all([document.fonts.load(`500 80px ${family}`), document.fonts.load(`400 30px ${family}`)]) } catch { /* шрифт по умолчанию */ }
  const c = document.createElement('canvas'); c.width = o.w; c.height = o.h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#d9cdb6'; ctx.fillRect(0, 0, o.w, o.h)
  if (o.imageUrl) {
    const res = await fetch(o.imageUrl)
    if (!res.ok) throw new Error('Не удалось загрузить фото для картинки')
    const bmp = await createImageBitmap(await res.blob())
    const k = Math.max(o.w / bmp.width, o.h / bmp.height)
    ctx.drawImage(bmp, (o.w - bmp.width * k) / 2, (o.h - bmp.height * k) / 2, bmp.width * k, bmp.height * k)
    bmp.close()
  }
  const light = o.style.color === 'light'
  ctx.fillStyle = light ? `rgba(0,0,0,${o.style.overlay / 100})` : `rgba(250,247,240,${o.style.overlay / 100})`
  ctx.fillRect(0, 0, o.w, o.h)
  const fg = light ? '#faf7f0' : '#111111'
  const x = o.align === 'left' ? o.w * 0.1 : o.align === 'center' ? o.w / 2 : o.w * 0.9
  ctx.textAlign = o.align; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = fg
  const maxW = o.w * 0.8
  const hs = Math.round(o.w * (serif ? 0.1 : 0.08)), ss = Math.round(o.w * 0.04)
  ctx.font = `500 ${hs}px ${family}`
  const hl = wrap(ctx, o.headline, maxW)
  ctx.font = `400 ${ss}px ${family}`
  const sl = o.subtitle ? wrap(ctx, o.subtitle, maxW) : []
  const total = hl.length * hs * 1.1 + (sl.length ? ss * 0.8 + sl.length * ss * 1.3 : 0)
  let y = (o.h - total) / 2 + hs
  ctx.font = `500 ${hs}px ${family}`
  for (const l of hl) { ctx.fillText(l, x, y); y += hs * 1.1 }
  y += ss * 0.4
  ctx.font = `400 ${ss}px ${family}`
  for (const l of sl) { ctx.fillText(l, x, y); y += ss * 1.3 }
  ctx.font = `400 ${Math.round(o.w * 0.026)}px ${family}`; ctx.textAlign = 'center'
  ctx.fillText(o.storeName.toUpperCase(), o.w / 2, o.h - o.h * 0.05)
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Не удалось создать картинку'))), 'image/png'))
}
