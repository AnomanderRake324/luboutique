import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { LANGS } from './lib/i18n'
import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductPage from './pages/Product'
import Collections from './pages/Collections'
import Contacts from './pages/Contacts'
const AdminApp = lazy(() => import('./admin/AdminApp'))

function startLang() {
  try { const s = localStorage.getItem('lang'); if (s === 'ru' || s === 'kk') return `/${s}` } catch { /* ignore */ }
  return navigator.language?.toLowerCase().startsWith('kk') ? '/kk' : '/ru'
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={startLang()} replace />} />
      <Route path="/admin/*" element={<Suspense fallback={<p className="pt-20 text-center">…</p>}><AdminApp /></Suspense>} />
      {LANGS.map((l) => (
        <Route key={l} path={`/${l}`} element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="product/:slug" element={<ProductPage />} />
        <Route path="collections" element={<Collections />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="*" element={<p className="py-32 text-center">404</p>} />
        </Route>
      ))}
      <Route path="*" element={<Navigate to={startLang()} replace />} />
    </Routes>
  )
}
