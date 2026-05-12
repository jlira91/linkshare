'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Link } from '@/lib/supabase'
import LinkCard from './LinkCard'
import AddLinkModal from './AddLinkModal'

const ALL_CATEGORIES = ['Todos', 'Videos', 'Artículos', 'Música', 'Recetas', 'Interesante', 'Humor', 'Cine / Series', 'Otros']

type Props = {
  userName: string
  userRole: 'husband' | 'wife'
}

export default function LinksClient({ userName, userRole }: Props) {
  const router = useRouter()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
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
  }

  const filtered = links.filter(l => {
    const matchCategory = category === 'Todos' || l.category === category
    const matchRead = showRead || !l.is_read
    return matchCategory && matchRead
  })

  const unreadCount = links.filter(l => !l.is_read).length

  // Group by category for "Todos" view
  const grouped = filtered.reduce<Record<string, Link[]>>((acc, link) => {
    const key = category === 'Todos' ? link.category : link.category
    if (!acc[key]) acc[key] = []
    acc[key].push(link)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-30 safe-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-stone-800 text-lg leading-tight">
              Para Ti 💌
            </h1>
            <p className="text-xs text-stone-500">
              Hola, {userName} · {unreadCount > 0 ? (
                <span className="text-rose-500 font-medium">{unreadCount} sin ver</span>
              ) : (
                <span className="text-green-500 font-medium">todo visto ✓</span>
              )}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-stone-400 hover:text-stone-600 text-sm py-1.5 px-3 rounded-xl hover:bg-stone-100 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Category tabs */}
      <div className="bg-white border-b border-stone-100 sticky top-[60px] z-20">
        <div className="max-w-lg mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide px-4 py-2 gap-2">
            {ALL_CATEGORIES.map(cat => {
              const count = cat === 'Todos'
                ? links.filter(l => showRead || !l.is_read).length
                : links.filter(l => l.category === cat && (showRead || !l.is_read)).length
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
                  {cat} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              )
            })}
          </div>
          {/* Show read toggle */}
          <div className="px-4 pb-2 flex items-center gap-2">
            <button
              onClick={() => setShowRead(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-colors font-medium ${
                showRead ? 'bg-stone-100 text-stone-600' : 'bg-rose-100 text-rose-600'
              }`}
            >
              <span>{showRead ? '👁 Mostrando todos' : '✓ Solo sin leer'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Links list */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <div className="w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full animate-spin mb-3" />
            <p className="text-sm">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">
              {links.length === 0 ? '💌' : '✨'}
            </div>
            <p className="text-stone-600 font-medium">
              {links.length === 0 ? 'Todavía no hay links' : 'Todo al día'}
            </p>
            <p className="text-stone-400 text-sm mt-1">
              {links.length === 0
                ? 'Los links que compartas aparecerán aquí'
                : 'No hay más links por ver en esta categoría'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {category === 'Todos' ? (
              Object.entries(grouped).map(([cat, catLinks]) => (
                <section key={cat}>
                  <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 px-1">
                    {cat}
                  </h2>
                  <div className="space-y-3">
                    {catLinks.map(link => (
                      <LinkCard
                        key={link.id}
                        link={link}
                        onToggleRead={handleToggleRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="space-y-3">
                {filtered.map(link => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onToggleRead={handleToggleRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB - only husband can add */}
      {userRole === 'husband' && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-6 right-4 w-14 h-14 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all z-30 safe-bottom"
          aria-label="Agregar link"
        >
          +
        </button>
      )}

      {showAdd && (
        <AddLinkModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
