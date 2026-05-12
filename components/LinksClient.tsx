'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Link } from '@/lib/supabase'
import LinkCard from './LinkCard'
import AddLinkModal from './AddLinkModal'

const ALL_CATEGORIES = ['Todos', 'Videos', 'Artículos', 'Música', 'Recetas', 'Interesante', 'Humor', 'Cine / Series', 'Otros']

type View = 'received' | 'sent' | 'history'

type Props = {
  userName: string
  userRole: 'husband' | 'wife'
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

function readAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  return `hace ${days} día${days > 1 ? 's' : ''}`
}

export default function LinksClient({ userName, userRole }: Props) {
  const router = useRouter()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('received')
  const [category, setCategory] = useState('Todos')
  const [showAdd, setShowAdd] = useState(false)
  const [showRead, setShowRead] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [pushStatus, setPushStatus] = useState<'idle' | 'granted' | 'denied'>('idle')

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/links')
    if (res.ok) setLinks(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchLinks() }, [fetchLinks])

  // Registrar push notifications al cargar
  useEffect(() => {
    registerPush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function registerPush() {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setPushStatus('denied'); return }
      setPushStatus('granted')

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
    } catch {
      // Silently ignore — push no es crítico
    }
  }

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
    if (res.ok) setLinks(prev => prev.filter(l => l.id !== id))
  }

  function handleAdd(link: Link) {
    setLinks(prev => [link, ...prev])
    setView('sent')
    setSearch('')
  }

  // Separar en recibidos / enviados
  const received = links.filter(l => l.added_by !== userRole)
  const sent = links.filter(l => l.added_by === userRole)
  const history = received.filter(l => l.is_read).sort((a, b) =>
    new Date(b.my_read_at ?? b.created_at).getTime() - new Date(a.my_read_at ?? a.created_at).getTime()
  )

  const unreadCount = received.filter(l => !l.is_read).length
  const unseenByOther = sent.filter(l => !l.other_read).length

  // Filtrar recibidos (sin incluir los ya leídos si showRead=false)
  const filteredReceived = received
    .filter(l => !l.is_read) // solo no leídos en la vista principal
    .filter(l => category === 'Todos' || l.category === category)
    .filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase()))

  // Filtrar enviados
  const filteredSent = sent.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase())
  )

  // Filtrar historial
  const filteredHistory = history.filter(l =>
    !search || l.title.toLowerCase().includes(search.toLowerCase())
  )

  // Agrupar recibidos por categoría
  const groupedReceived = filteredReceived.reduce<Record<string, Link[]>>((acc, link) => {
    if (!acc[link.category]) acc[link.category] = []
    acc[link.category].push(link)
    return acc
  }, {})

  const headerHeight = view === 'received' ? 'top-[60px]' : 'top-[60px]'

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-30 safe-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-stone-800 text-lg leading-tight">Para Ti 💌</h1>
            <p className="text-xs text-stone-500">
              Hola, {userName} ·{' '}
              {unreadCount > 0
                ? <span className="text-rose-500 font-medium">{unreadCount} sin ver</span>
                : <span className="text-green-500 font-medium">todo visto ✓</span>}
              {pushStatus === 'denied' && (
                <span className="ml-1 text-amber-500">· notif. bloqueadas</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setShowSearch(v => !v); setSearch('') }}
              className="text-stone-400 hover:text-stone-600 text-lg py-1.5 px-2 rounded-xl hover:bg-stone-100 transition-colors"
              aria-label="Buscar"
            >
              🔍
            </button>
            <button
              onClick={logout}
              className="text-stone-400 text-sm py-1.5 px-3 rounded-xl hover:bg-stone-100 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        {showSearch && (
          <div className="px-4 pb-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título o descripción..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-stone-800 text-sm bg-stone-50"
            />
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className={`bg-white border-b border-stone-100 sticky ${headerHeight} z-20`}>
        <div className="max-w-lg mx-auto px-4 pt-2">
          <div className="flex gap-1">
            <button
              onClick={() => setView('received')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                view === 'received' ? 'bg-rose-50 text-rose-600' : 'text-stone-500 hover:bg-stone-50'
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
                view === 'sent' ? 'bg-rose-50 text-rose-600' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              📤 Enviados
              {unseenByOther > 0 && (
                <span className="ml-1.5 bg-stone-300 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unseenByOther}
                </span>
              )}
            </button>
            <button
              onClick={() => setView('history')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                view === 'history' ? 'bg-rose-50 text-rose-600' : 'text-stone-500 hover:bg-stone-50'
              }`}
            >
              📚 Vistos
              {history.length > 0 && (
                <span className="ml-1 text-stone-400 text-xs font-normal">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filtros de categoría — solo en "Para ti" */}
        {view === 'received' && (
          <div className="flex overflow-x-auto px-4 py-2 gap-2">
            {ALL_CATEGORIES.map(cat => {
              const count = cat === 'Todos'
                ? received.filter(l => !l.is_read).length
                : received.filter(l => l.category === cat && !l.is_read).length
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
        )}

        {/* Info de enviados */}
        {view === 'sent' && (
          <div className="px-4 py-2 pb-3">
            <p className="text-xs text-stone-400">
              {sent.length === 0 ? 'Todavía no has enviado nada' :
                `${sent.length} enviado${sent.length !== 1 ? 's' : ''} · ${sent.filter(l => l.other_read).length} vistos`}
            </p>
          </div>
        )}

        {/* Info del historial */}
        {view === 'history' && (
          <div className="px-4 py-2 pb-3">
            <p className="text-xs text-stone-400">
              {history.length === 0 ? 'Todavía no has leído nada' :
                `${history.length} link${history.length !== 1 ? 's' : ''} leído${history.length !== 1 ? 's' : ''}`}
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
        ) : view === 'received' ? (
          filteredReceived.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">{received.length === 0 ? '💌' : '✨'}</div>
              <p className="text-stone-600 font-medium">
                {search ? 'Sin resultados' : received.length === 0 ? 'Nadie te ha enviado nada aún' : '¡Todo leído!'}
              </p>
              <p className="text-stone-400 text-sm mt-1">
                {!search && received.length > 0 && 'Los leídos están en la pestaña 📚 Vistos'}
              </p>
            </div>
          ) : category === 'Todos' ? (
            <div className="space-y-6">
              {Object.entries(groupedReceived).map(([cat, catLinks]) => (
                <section key={cat}>
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">{cat}</h2>
                  <div className="space-y-3">
                    {catLinks.map(link => (
                      <LinkCard key={link.id} link={link} mode="received" onToggleRead={handleToggleRead} onDelete={handleDelete} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReceived.map(link => (
                <LinkCard key={link.id} link={link} mode="received" onToggleRead={handleToggleRead} onDelete={handleDelete} />
              ))}
            </div>
          )
        ) : view === 'sent' ? (
          filteredSent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📤</div>
              <p className="text-stone-600 font-medium">{search ? 'Sin resultados' : 'No has enviado links aún'}</p>
              <p className="text-stone-400 text-sm mt-1">{!search && 'Toca el + para compartir algo'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSent.map(link => (
                <LinkCard key={link.id} link={link} mode="sent" onToggleRead={handleToggleRead} onDelete={handleDelete} />
              ))}
            </div>
          )
        ) : (
          // Historial
          filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-stone-600 font-medium">{search ? 'Sin resultados' : 'Todavía no has leído nada'}</p>
              <p className="text-stone-400 text-sm mt-1">{!search && 'Los links que abras aparecerán aquí'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map(link => (
                <div key={link.id} className="relative">
                  {link.my_read_at && (
                    <p className="text-xs text-stone-400 mb-1 px-1">
                      Leído {readAgo(link.my_read_at)}
                    </p>
                  )}
                  <LinkCard link={link} mode="received" onToggleRead={handleToggleRead} onDelete={handleDelete} />
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-4 w-14 h-14 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-30 safe-bottom"
      >
        +
      </button>

      {showAdd && <AddLinkModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}
