export type Lang = 'ru' | 'kk'
export const LANGS: Lang[] = ['ru', 'kk']
export type Localized = Record<Lang, string>

// Казахские тексты — черновик, требуют проверки носителем языка перед запуском.
const dict = {
  nav_home: { ru: 'Главная', kk: 'Басты бет' },
  nav_catalog: { ru: 'Каталог', kk: 'Каталог' },
  nav_collections: { ru: 'Коллекции', kk: 'Коллекциялар' },
  nav_contacts: { ru: 'Контакты', kk: 'Байланыс' },
  hero_title: { ru: 'Образ, который вам по душе', kk: 'Жүрегіңізге жақын бейне' },
  hero_sub: { ru: 'Женская одежда в Қызылорда', kk: 'Қызылордадағы әйелдер киімі' },
  hero_cta: { ru: 'Смотреть каталог', kk: 'Каталогты қарау' },
  featured: { ru: 'Избранное', kk: 'Таңдаулылар' },
  new_arrivals: { ru: 'Новинки', kk: 'Жаңа түсімдер' },
  all: { ru: 'Все', kk: 'Барлығы' },
  search: { ru: 'Поиск', kk: 'Іздеу' },
  search_ph: { ru: 'Найти товар…', kk: 'Тауар іздеу…' },
  category: { ru: 'Категория', kk: 'Санат' },
  size: { ru: 'Размер', kk: 'Өлшемі' },
  color: { ru: 'Цвет', kk: 'Түсі' },
  sort: { ru: 'Сортировка', kk: 'Сұрыптау' },
  sort_default: { ru: 'По умолчанию', kk: 'Әдепкі' },
  sort_asc: { ru: 'Цена: по возрастанию', kk: 'Бағасы: өсу бойынша' },
  sort_desc: { ru: 'Цена: по убыванию', kk: 'Бағасы: кему бойынша' },
  in_stock: { ru: 'В наличии', kk: 'Қолда бар' },
  out_of_stock: { ru: 'Нет в наличии', kk: 'Қолда жоқ' },
  few_left: { ru: 'Осталось мало', kk: 'Аз қалды' },
  nothing_found: { ru: 'Ничего не найдено', kk: 'Ештеңе табылмады' },
  order_wa: { ru: 'Заказать в WhatsApp', kk: 'WhatsApp арқылы тапсырыс беру' },
  order_note: {
    ru: 'Нажатие откроет WhatsApp с готовым сообщением. Заказ не подтверждён, пока продавец не ответит вам.',
    kk: 'Басқанда WhatsApp дайын хабарламамен ашылады. Сатушы жауап бермейінше тапсырыс расталмайды.',
  },
  choose_size: { ru: 'Выберите размер', kk: 'Өлшемді таңдаңыз' },
  choose_color: { ru: 'Выберите цвет', kk: 'Түсті таңдаңыз' },
  back: { ru: 'Назад в каталог', kk: 'Каталогқа оралу' },
  collections_title: { ru: 'Коллекции', kk: 'Коллекциялар' },
  contacts_title: { ru: 'Контакты', kk: 'Байланыс' },
  address: { ru: 'Адрес', kk: 'Мекенжай' },
  phone: { ru: 'Телефон', kk: 'Телефон' },
  write_wa: { ru: 'Написать в WhatsApp', kk: 'WhatsApp-қа жазу' },
  demo_badge: { ru: 'Демо-данные', kk: 'Демо деректер' },
  demo_banner: {
    ru: 'Демонстрационные товары. Будут заменены реальными позициями.',
    kk: 'Демонстрациялық тауарлар. Нақты тауарлармен ауыстырылады.',
  },
  footer_rights: { ru: 'Все права защищены', kk: 'Барлық құқықтар қорғалған' },
  not_found: { ru: 'Страница не найдена', kk: 'Бет табылмады' },
  empty_store: { ru: 'Скоро здесь появятся новые поступления', kk: 'Жақында мұнда жаңа тауарлар пайда болады' },
  skip: { ru: 'К содержимому', kk: 'Мазмұнға өту' },
  menu: { ru: 'Меню', kk: 'Мәзір' },
  language_label: { ru: 'Язык', kk: 'Тіл' },
  banner_cta: { ru: 'Подробнее', kk: 'Толығырақ' },
  loading: { ru: 'Загрузка…', kk: 'Жүктелуде…' },
  demo_img: { ru: 'Здесь будет фото', kk: 'Мұнда сурет болады' },
} satisfies Record<string, Localized>

export type Key = keyof typeof dict
export const t = (lang: Lang, key: Key) => dict[key][lang]
export const loc = (v: Localized, lang: Lang) => v[lang] || v.ru
export const isLang = (s?: string): s is Lang => s === 'ru' || s === 'kk'
export const formatKZT = (n: number) =>
  new Intl.NumberFormat('ru-KZ').format(n).replace(/\u00a0/g, ' ') + ' ₸'
