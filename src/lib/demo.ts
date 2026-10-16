import type { Category, Collection, Product } from './types'

// ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ — удалить этот файл на Этапе 3, когда подключится Supabase.
export const CATEGORIES: Category[] = [
  { id: 'dresses', name: { ru: 'Платья', kk: 'Көйлектер' } },
  { id: 'outer', name: { ru: 'Верхняя одежда', kk: 'Сыртқы киім' } },
  { id: 'tops', name: { ru: 'Блузы и топы', kk: 'Блузкалар мен топтар' } },
  { id: 'skirts', name: { ru: 'Юбки и брюки', kk: 'Юбка мен шалбар' } },
]
export const COLLECTIONS: Collection[] = [
  { id: 'spring', slug: 'spring', cover: null, name: { ru: 'Весна', kk: 'Көктем' }, blurb: { ru: 'Лёгкие ткани и мягкие оттенки', kk: 'Жеңіл маталар мен жұмсақ реңктер' }, tone: '#d9cdb6' },
  { id: 'evening', slug: 'evening', cover: null, name: { ru: 'Вечерняя', kk: 'Кешкі' }, blurb: { ru: 'Для особых случаев', kk: 'Ерекше сәттерге арналған' }, tone: '#2b2b2b' },
]
const d = (n: number, ru: string, kk: string, dru: string, dkk: string, category: string, price: number, collection: string, tones: string[], o: Partial<Product> = {}): Product => ({
  id: `demo-${n}`, slug: `demo-${n}`, name: { ru, kk }, description: { ru: dru, kk: dkk }, categoryId: category, price,
  sizes: ['S', 'M', 'L'], colors: ['Бежевый', 'Чёрный'], stockStatus: 'in_stock', featured: false, isNew: false, tones, images: [], collectionIds: [collection], isDemo: true, ...o,
})
export const PRODUCTS: Product[] = [
  d(1, 'Платье «Лён»', '«Зығыр» көйлегі', 'Демо-описание. Свободный крой, натуральная ткань.', 'Демо сипаттама. Еркін пішім, табиғи мата.', 'dresses', 24900, 'spring', ['#e8dfcc', '#cbbfa5'], { featured: true, isNew: true }),
  d(2, 'Пальто «Классика»', '«Классика» пальтосы', 'Демо-описание. Прямой силуэт, плотная ткань.', 'Демо сипаттама. Тік силуэт, тығыз мата.', 'outer', 59900, 'evening', ['#3a3a3a', '#1c1c1c'], { featured: true, sizes: ['M', 'L', 'XL'], colors: ['Чёрный', 'Серый'] }),
  d(3, 'Блуза «Шёлк»', '«Жібек» блузкасы', 'Демо-описание. Мягкая драпировка.', 'Демо сипаттама. Жұмсақ драпировка.', 'tops', 15900, 'spring', ['#f1ebdd', '#d9cdb6'], { isNew: true, colors: ['Айвори'] }),
  d(4, 'Брюки палаццо', 'Палаццо шалбары', 'Демо-описание. Высокая посадка.', 'Демо сипаттама. Жоғары бел.', 'skirts', 18900, 'spring', ['#c9bda4', '#b3a68b'], { featured: true, stockStatus: 'low' }),
  d(5, 'Вечернее платье', 'Кешкі көйлек', 'Демо-описание. Тонкая линия плеча.', 'Демо сипаттама. Иық сызығы нәзік.', 'dresses', 42900, 'evening', ['#1c1c1c', '#4a4a4a'], { colors: ['Чёрный'], isNew: true }),
  d(6, 'Юбка миди', 'Миди юбка', 'Демо-описание. Плиссе.', 'Демо сипаттама. Плиссе.', 'skirts', 17900, 'spring', ['#d2c5ab', '#e8dfcc']),
  d(7, 'Жакет «Букле»', '«Букле» жакеті', 'Демо-описание. Структурный крой.', 'Демо сипаттама. Құрылымды пішім.', 'outer', 38900, 'evening', ['#bfb299', '#8d826c'], { stockStatus: 'out' }),
  d(8, 'Топ «Базовый»', '«Базалық» топ', 'Демо-описание. Универсальная база гардероба.', 'Демо сипаттама. Гардеробтың әмбебап негізі.', 'tops', 8900, 'spring', ['#faf7f0', '#e4dac6'], { colors: ['Айвори', 'Чёрный'] }),
]
