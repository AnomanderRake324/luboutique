import { formatKZT, loc, type Lang } from './i18n'
import type { Product } from './types'

export function buildWhatsAppLink(p: Product, lang: Lang, number: string, size?: string, color?: string): string {
  const url = `${window.location.origin}/${lang}/product/${p.slug}`
  const lines =
    lang === 'kk'
      ? ['Сәлеметсіз бе! Мына тауарға қызығып отырмын:', loc(p.name, lang), `Бағасы: ${formatKZT(p.price)}`, size ? `Өлшемі: ${size}` : '', color ? `Түсі: ${color}` : '', url]
      : ['Здравствуйте! Меня интересует товар:', loc(p.name, lang), `Цена: ${formatKZT(p.price)}`, size ? `Размер: ${size}` : '', color ? `Цвет: ${color}` : '', url]
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`
}
