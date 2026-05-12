'use client'

import { useState, useEffect } from 'react'
import type { Link } from '@/lib/supabase'

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

type Props = {
  onClose: () => void
  onAdd: (link: Link) => void
}

export default function AddLinkModal({ onClose, onAdd }: Props) {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Otros')
  const [imageUrl, setImageUrl] = useState('')
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchMetadata(inputUrl: string) {
    if (!inputUrl.startsWith('http')) return
    setFetchingMeta(true)
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(inputUrl)}`)
      const data = await res.json()
      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description)
      if (data.image) setImageUrl(data.image)
    } catch {
      // ignore metadata errors
    } finally {
      setFetchingMeta(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url || !title || !category) return
    setSaving(true)
    setError('')

    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, title, description, category, image_url: imageUrl }),
    })

    if (res.ok) {
      const newLink = await res.json()
      onAdd(newLink)
      onClose()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al guardar')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl pb-safe max-h-[92vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-stone-800">Agregar link</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-2xl w-8 h-8 flex items-center justify-center">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                URL / Link
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onBlur={e => fetchMetadata(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-stone-800 text-base pr-10"
                  required
                />
                {fetchingMeta && (
                  <span className="absolute right-3 top-3.5 text-stone-400 text-xs">buscando...</span>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="¿De qué trata?"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-stone-800 text-base"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Descripción <span className="text-stone-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Por qué te lo recomiendo..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-stone-800 text-base resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Categoría
              </label>
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

            {error && (
              <p className="text-rose-500 text-sm text-center bg-rose-50 rounded-xl py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !url || !title}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold rounded-2xl transition-colors text-base mt-2"
            >
              {saving ? 'Guardando...' : 'Guardar link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
