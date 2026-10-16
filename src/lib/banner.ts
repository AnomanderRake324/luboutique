import type { BannerStyle } from './types'
export const DEFAULT_STYLE: BannerStyle = { color: 'light', overlay: 35, font: 'serif' }
export function parseStyle(v: unknown): BannerStyle {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<BannerStyle>
  const ov = Number(o.overlay)
  return { color: o.color === 'dark' ? 'dark' : 'light', overlay: Number.isFinite(ov) ? Math.min(80, Math.max(0, ov)) : DEFAULT_STYLE.overlay, font: o.font === 'sans' ? 'sans' : 'serif' }
}
