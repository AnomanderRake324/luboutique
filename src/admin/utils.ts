const M: Record<string, string> = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',ә:'a',ғ:'g',қ:'k',ң:'n',ө:'o',ұ:'u',ү:'u',һ:'h',і:'i' }

export const slugify = (s: string) =>
  s.toLowerCase().split('').map((c) => M[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'item'

export const randSuffix = () => Math.random().toString(36).slice(2, 6)

export const splitList = (s: string) => [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))]

export function errText(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: unknown }).message)
  return 'Неизвестная ошибка'
}
export const isDuplicate = (e: unknown) => !!e && typeof e === 'object' && 'code' in e && (e as { code: unknown }).code === '23505'

const MAX_SIDE = 1600
const MAX_BYTES = 2.8 * 1024 * 1024 // бакет принимает до 3 МБ

// Уменьшает фото на телефоне до ≤1600 px и сжимает в WebP до загрузки (экономит место и трафик).
export async function optimizeImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error(`«${file.name}» — не изображение`)
  if (file.size > 25 * 1024 * 1024) throw new Error(`«${file.name}» слишком большой (больше 25 МБ)`)
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  for (const q of [0.82, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', q))
    if (blob && blob.size <= MAX_BYTES) return blob
  }
  throw new Error(`Не удалось сжать «${file.name}» до допустимого размера`)
}

// "+7 777 705 1100", "8 777 705 11 00" → "77777051100"; null если номер некорректен
export function normalizePhone(s: string): string | null {
  let d = s.replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('8')) d = '7' + d.slice(1)
  return /^[1-9][0-9]{9,14}$/.test(d) ? d : null
}
export const isHttpsUrl = (s: string) => /^https:\/\/[^\s]+$/.test(s)
