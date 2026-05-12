'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Link } from '@/lib/supabase'
import LinkCard from './LinkCard'
import AddLinkModal from './AddLinkModal'

const ALL_CATEGORIES = ['Todos', 'Videos', 'Artículos', 'Música', 'Recetas', 'Interesante', 'Humor', 'Cine / Series', 'Otros']

type View = 'received' | 'sent'

type Props = {
  userName: string
  userRole: 'husband' | 'wife'
}

export default function LinksClient({ userName, userRole }: Props) {
  const router = useRouter()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('received')
  const [category, setCategory] = useState('Todos')
  const [showAdd, setShowAdd] = useState(false)
  const [showRead, setShowRead] = useState(true)

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/links')
    if (res.ok) {
      const data = await res.json()
      setLinks(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  async function handleToggleRead(id: string, isRead: boolean) {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: isRead }),
    })
    if (res.ok) {
      const updated = await res.json()
      setLinks(prev => prev.map(l => l.id === id ? updated : l))
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setLinks(prev => prev.filter(l => l.id !== id))
    }
  }

  function handleAdd(link: Link) {
    setLinks(prev => [link, ...prev])
    setView('sent') // ir a Enviados para ver el link recién agregado
  }

  // Links recibidos = los que envió la otra persona
  const received = links.filter(l => l.added_by !== userRole)
  // Links enviados = los que envié yo
  const sent = links.filter(l => l.added_by === userRole)

  const unreadCount = received.filter(l => !l.is_read).length
  const unseenBySother = sent.filter(l => !l.other_read).length

  // Filtros solo aplican a Recibidos
  const filteredReceived = received.filter(l => {
    const matchCat = category === 'Todos' || l.category === category
    const matchRead = showRead || !l.is_read
    return matchCat && matchRead
  })

  // Agrupar recibidos por categoría cuando está en "Todos"
  const groupedReceived = filteredReceived.reduce<Record<string, Link[]>>((acc, link) => {
    const key = link.category
    if (!acc[key]) acc[key] = []
    acc[key].push(link)
    return acc
  }, {})

  const displayLinks = view === 'received' ? filteredReceived : sent

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-30 safe-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-stone-800 text-lg leading-tight">Para Ti 💌</h1>
            <p className="text-xs text-stone-500">
              Hola, {userName} ·{' '}
              {unreadCount > 0 ? (
                <span className="text-rose-500 font-medium">{unreadCount} sin ver</span>
              ) : (
                <span className="text-green-500 font-medium">todo visto ✓</span>
              )}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-stone-400 text-sm py-1.5 px-3 rounded-xl hover:bg-stone-100 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Vista tabs: Recibidos / Enviados */}
      <div className="bg-white border-b border-stone-100 sticky top-[60px] z-20">
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="flex gap-1">
            <button
              onClick={() => setView('received')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
                view === 'received'
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              📨 Para ti
              {unreadCount > 0 && (
                <span className="ml-1.5 bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('sent')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                view === 'sent'
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              📤 Enviados
              {unseenBySother > 0 && (
                <span className="ml-1.5 bg-stone-300 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unseenBySother}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filtros solo en Recibidos */}
        {view === 'received' && (
          <>
            <div className="flex overflow-x-auto px-4 py-2 gap-2">
              {ALL_CATEGORIES.map(cat => {
                const count = cat === 'Todos'
                  ? received.filter(l => showRead || !l.is_read).length
                  : received.filter(l => l.category === cat && (showRead || !l.is_read)).length
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      category === cat
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {cat} {count > 0 && <span className="opacity-70">{count}</span>}
                  </button>
                )
              })}
            </div>
            <div className="px-4 pb-2">
              <button
                onClick={() => setShowRead(v => !v)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  showRead ? 'bg-stone-100 text-stone-600' : 'bg-rose-100 text-rose-600'
                }`}
              >
                {showRead ? '👁 Mostrando todos' : '✉️ Solo sin leer'}
              </button>
            </div>
          </>
        )}

        {/* Resumen en Enviados */}
        {view === 'sent' && (
          <div className="px-4 py-2 pb-3">
            <p className="text-xs text-stone-400">
              {sent.length === 0
                ? 'Todavía no has enviado nada'
                : `${sent.length} enviado${sent.length > 1 ? 's' : ''} · ${sent.filter(l => l.other_read).length} vistos`}
            </p>
          </div>
        )}
      </div>

      {/* Lista */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Cargando...</p>
          </div>
        ) : displayLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">{view === 'received' ? '💌' : '📤'}</div>
            <p className="text-stone-600 font-medium">
              {view === 'received'
                ? received.length === 0 ? 'Nadie te ha enviado nada aún' : 'Todo al día ✓'
                : 'No has enviado links aún'}
            </p>
            <p className="text-stone-400 text-sm mt-1">
              {view === 'sent' && 'Toca el botón + para compartir algo'}
            </p>
          </div>
        ) : view === 'received' && category === 'Todos' ? (
          // Agrupado por categoría
          <div className="space-y-6">
            {Object.entries(groupedReceived).map(([cat, catLinks]) => (
              <section key={cat}>
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">
                  {cat}
                </h2>
                <div className="space-y-3">
                  {catLinks.map(link => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      mode="received"
                      onToggleRead={handleToggleRead}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayLinks.map(link => (
              <LinkCard
                key={link.id}
                link={link}
                mode={view}
                onToggleRead={handleToggleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-4 w-14 h-14 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-30 safe-bottom"
        aria-label="Agregar link"
      >
        +
      </button>

      {showAdd && (
        <AddLinkModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
