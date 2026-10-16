import { existsSync, readFileSync } from 'node:fs'
// Переменные берутся из окружения (Cloudflare), а локально — из .env.local / .env
export function loadEnv() {
  const out = { ...process.env }
  for (const f of ['.env', '.env.local']) {
    if (!existsSync(f)) continue
    for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return out
}
