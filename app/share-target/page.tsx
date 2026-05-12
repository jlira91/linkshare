'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

const CATEGORIES = [
  { label: 'Videos', emoji: '📹' },
  { label: 'Artículos', emoji: '📰' },
  { label: 'Música', emoji: '🎵' },
  { label: 'Recetas', emoji: '🍳' },
  { label: 'Interesante', emoji: '💡' },
  { label: 'Humor', emoji: '😂' },
  { label: 'Cine / Series', emoji: '🎬' },
  { label: 'Otros', emoji: '📦' },
]

function ShareTargetContent() {
  const params = useSearchParams()
  const router = useRouter()

  const sharedUrl = params.get('url') || params.get('text') || ''
  const sharedTitle = params.get('title') || ''

  const [title, setTitle] = useState(sharedTitle)
  const [category, setCategory] = useState('Otros')
  const [imageUrl, setImageUrl] = useState('')
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'form' | 'done' | 'error' | 'auth'>('form')

  // Auto-fetch metadata cuando carga
  useEffect(() => {
    if (!sharedUrl) return
    setFetchingMeta(true)
    fetch(`/api/metadata?url=${encodeURIComponent(sharedUrl)}`)
      .then(r => r.json())
      .then(data => {
        if (data.title && !sharedTitle) setTitle(data.title)
        if (data.image) setImageUrl(data.image)
      })
      .catch(() => {})
      .finally(() => setFetchingMeta(false))
  }, [sharedUrl, sharedTitle])

  async function handleSave() {
    if (!sharedUrl) return
    setSaving(true)

    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: sharedUrl,
        title: title || sharedUrl,
        description: '',
        category,
        image_url: imageUrl,
      }),
    })

    if (res.ok) {
      setStatus('done')
      setTimeout(() => router.push('/links'), 1800)
    } else if (res.status === 401) {
      setStatus('auth')
    } else {
      setStatus('error')
    }
    setSaving(false)
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="text-5xl mb-3">✅</div>
          <p className="font-bold text-stone-800 text-lg">¡Link guardado!</p>
          <p className="text-stone-500 text-sm mt-1">Volviendo a la app...</p>
        </div>
      </div>
    )
  }

  if (status === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="text-5xl mb-3">🔒</div>
          <p className="font-bold text-stone-800 text-lg">Necesitas iniciar sesión</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 w-full py-3 bg-rose-500 text-white font-semibold rounded-2xl"
          >
            Ir al login
          </button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="text-5xl mb-3">❌</div>
          <p className="font-bold text-stone-800">Error al guardar</p>
          <button
            onClick={() => router.push('/links')}
            className="mt-4 text-rose-500 font-medium"
          >
            Volver a la app
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-600 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg shadow-2xl pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          <h2 className="text-xl font-bold text-stone-800 mb-4">Compartir link 💌</h2>

          {/* URL preview */}
          <div className="bg-stone-50 rounded-2xl p-3 mb-4 border border-stone-100">
            <p className="text-xs text-stone-400 mb-0.5">Link</p>
            <p className="text-sm text-stone-600 truncate">{sharedUrl}</p>
          </div>

          {/* Título */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Título {fetchingMeta && <span className="text-stone-400 font-normal">buscando...</span>}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="¿De qué trata?"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-stone-800 text-base"
            />
          </div>

          {/* Categoría */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-stone-700 mb-2">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-2xl border-2 transition-all text-xs font-medium ${
                    category === cat.label
                      ? 'border-rose-400 bg-rose-50 text-rose-700'
                      : 'border-stone-200 text-stone-600'
                  }`}
                >
                  <span className="text-xl mb-0.5">{cat.emoji}</span>
                  <span className="leading-tight text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !sharedUrl}
            className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold rounded-2xl transition-colors text-base"
          >
            {saving ? 'Guardando...' : 'Guardar link 💌'}
          </button>

          <button
            onClick={() => router.push('/links')}
            className="w-full py-3 text-stone-400 text-sm mt-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ShareTargetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ShareTargetContent />
    </Suspense>
  )
}
