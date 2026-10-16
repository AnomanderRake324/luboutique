import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// null = Supabase не настроен: витрина работает на демо-данных, вход в админку недоступен.
export const supabase = url && key ? createClient(url, key) : null
export const mediaUrl = (path: string) => `${url}/storage/v1/object/public/media/${path}`
