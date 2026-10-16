import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadCatalog } from './api'
import type { CatalogData } from './types'

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: CatalogData }
const Ctx = createContext<State>({ status: 'loading' })
export const useCatalogState = () => useContext(Ctx)
export function useCatalog(): CatalogData {
  const s = useContext(Ctx)
  if (s.status !== 'ready') throw new Error('Catalog not ready')
  return s.data
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    loadCatalog().then((data) => live && setState({ status: 'ready', data })).catch(() => live && setState({ status: 'error' }))
    return () => { live = false }
  }, [attempt])
  return <Ctx.Provider value={state}>{state.status === 'error' ? <Retry onRetry={() => { setState({ status: 'loading' }); setAttempt(attempt + 1) }} /> : children}</Ctx.Provider>
}

function Retry({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen grid place-items-center text-center px-5">
      <div>
        <p className="mb-6">Не удалось загрузить данные. Проверьте интернет / Деректерді жүктеу мүмкін болмады.</p>
        <button onClick={onRetry} className="bg-ink text-ivory px-6 py-3 uppercase tracking-widest text-xs">Повторить / Қайталау</button>
      </div>
    </div>
  )
}
