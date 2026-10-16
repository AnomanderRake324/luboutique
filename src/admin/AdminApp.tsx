import { useState, type FormEvent } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthProvider, useAuth } from './AuthContext'
import ProductList from './ProductList'
import ProductEditor from './ProductEditor'
import Categories from './Categories'
import Settings from './Settings'
import CollectionList from './CollectionList'
import CollectionEditor from './CollectionEditor'
import BannerList from './BannerList'
import BannerEditor from './BannerEditor'
import HomeAdmin from './HomeAdmin'

const input = 'w-full border border-beige bg-ivory px-3 py-3 mt-1'

function Login() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) setErr('Неверный email или пароль')
    setBusy(false)
  }
  return (
    <form onSubmit={submit} className="max-w-sm mx-auto pt-20 px-5">
      <h1 className="text-4xl mb-8">Вход</h1>
      <label className="block text-sm mb-4">Email<input type="email" required autoComplete="username" className={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label className="block text-sm mb-4">Пароль<input type="password" required autoComplete="current-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {err && <p role="alert" className="text-red-800 text-sm mb-4">{err}</p>}
      <button disabled={busy} className="w-full bg-ink text-ivory py-3 uppercase tracking-widest text-xs disabled:opacity-50">{busy ? '…' : 'Войти'}</button>
    </form>
  )
}

function Gate() {
  const { session, isAdmin, loading, configured } = useAuth()
  if (!configured) return <p className="max-w-md mx-auto pt-20 px-5">Supabase не настроен. Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env (см. .env.example).</p>
  if (loading) return <p className="pt-20 text-center">Загрузка…</p>
  if (!session) return <Login />
  if (!isAdmin) return (
    <div className="max-w-md mx-auto pt-20 px-5">
      <p>Этот аккаунт не имеет прав администратора.</p>
      <button onClick={() => supabase!.auth.signOut()} className="mt-6 underline">Выйти</button>
    </div>
  )
  return (
    <div className="min-h-screen">
      <header className="border-b border-beige px-5 py-3 flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest">
        <Link to="/admin">Товары</Link>
        <Link to="/admin/categories">Категории</Link>
        <Link to="/admin/collections">Коллекции</Link>
        <Link to="/admin/banners">Баннеры</Link>
        <Link to="/admin/home">Главная</Link>
        <Link to="/admin/settings">Настройки</Link>
        <a href="/" target="_blank" rel="noopener noreferrer">Открыть сайт</a>
        <button onClick={() => supabase!.auth.signOut()} className="ml-auto underline">Выйти</button>
      </header>
      <Routes>
        <Route index element={<ProductList />} />
        <Route path="products/new" element={<ProductEditor />} />
        <Route path="products/:id" element={<ProductEditor />} />
        <Route path="categories" element={<Categories />} />
        <Route path="settings" element={<Settings />} />
        <Route path="collections" element={<CollectionList />} />
        <Route path="collections/new" element={<CollectionEditor />} />
        <Route path="collections/:id" element={<CollectionEditor />} />
        <Route path="banners" element={<BannerList />} />
        <Route path="banners/new" element={<BannerEditor />} />
        <Route path="banners/:id" element={<BannerEditor />} />
        <Route path="home" element={<HomeAdmin />} />
        <Route path="*" element={<p className="pt-12 text-center">Страница не найдена</p>} />
      </Routes>
    </div>
  )
}

export default function AdminApp() {
  return <AuthProvider><Gate /></AuthProvider>
}
