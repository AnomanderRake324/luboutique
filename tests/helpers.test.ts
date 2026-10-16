import { strict as assert } from 'node:assert'
import { normalizePhone, slugify, splitList } from '../src/admin/utils'
import { formatKZT } from '../src/lib/i18n'
import { buildWhatsAppLink } from '../src/lib/whatsapp'
import type { Product } from '../src/lib/types'

;(globalThis as unknown as { window: { location: { origin: string } } }).window = { location: { origin: 'https://shop.example' } }

assert.equal(normalizePhone('+7 777 705 1100'), '77777051100')
assert.equal(normalizePhone('8 777 705 11 00'), '77777051100')
assert.equal(normalizePhone('12'), null)
assert.equal(slugify('Платье «Лён» М'), 'plate-len-m')
assert.equal(slugify('Қазақша көйлек'), 'kazaksha-koylek')
assert.deepEqual(splitList('S, M,, S , L'), ['S', 'M', 'L'])
assert.equal(formatKZT(24900), '24 900 ₸')

const p: Product = { id: '1', slug: 'plate-len', name: { ru: 'Платье «Лён»', kk: 'Көйлек' }, description: { ru: '', kk: '' }, categoryId: null, price: 24900, sizes: [], colors: [], stockStatus: 'in_stock', featured: false, isNew: false, images: [], tones: [], collectionIds: [], isDemo: false }
const url = new URL(buildWhatsAppLink(p, 'ru', '77777051100', 'M', 'Бежевый & чёрный'))
assert.equal(url.origin + url.pathname, 'https://wa.me/77777051100')
const text = url.searchParams.get('text')!
for (const part of ['Платье «Лён»', '24 900 ₸', 'Размер: M', 'Цвет: Бежевый & чёрный', 'https://shop.example/ru/product/plate-len']) assert.ok(text.includes(part), part)
assert.ok(!buildWhatsAppLink(p, 'kk', '77777051100').includes(' '), 'ссылка не содержит пробелов')
console.log('all helper tests passed')
