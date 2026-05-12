'use client'

import { useState } from 'react'
import type { Link } from '@/lib/supabase'

const CATEGORY_EMOJIS: Record<string, string> = {
  'Videos': '📹',
  'Artículos': '📰',
  'Música': '🎵',
  'Recetas': '🍳',
  'Interesante': '💡',
  'Humor': '😂',
  'Cine / Series': '🎬',
  'Otros': '📦',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (mins < 1) return 'ahora mismo'
  if (mins < 60) return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`
  if (weeks < 5) return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}

type Props = {
  link: Link
  mode: 'received' | 'sent'
  onToggleRead: (id: string, isRead: boolean) => void
  onDelete: (id: string) => void
}

export default function LinkCard({ link, mode, onToggleRead, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const hostname = (() => {
    try { return new URL(link.url).hostname.replace('www.', '') }
    catch { return '' }
  })()

  const faviconUrl = hostname
    ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
    : null

  const isUnread = mode === 'received' && !link.is_read

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
      isUnread ? 'border-rose-200' : 'border-stone-100 opacity-80'
    }`}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4"
        onClick={() => {
          if (mode === 'received' && !link.is_read) onToggleRead(link.id, true)
        }}
      >
        {/* Top row */}
        <div className="flex items-start gap-3">
          {link.image_url ? (
            <img
              src={link.image_url}
              alt=""
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-stone-100"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : faviconUrl ? (
            <div className="w-16 h-16 rounded-xl bg-stone-50 flex items-center justify-center flex-shrink-0 border border-stone-100">
              <img src={faviconUrl} alt="" className="w-7 h-7" />
            </div>
          ) : null}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold leading-snug line-clamp-2 ${
                isUnread ? 'text-stone-800' : 'text-stone-500'
              }`}>
                {link.title}
              </h3>
              {/* Indicador por modo */}
              {mode === 'received' && isUnread && (
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5" />
              )}
              {mode === 'sent' && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium ${
                  link.other_read
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {link.other_read ? 'Visto ✓' : 'Sin abrir'}
                </span>
              )}
            </div>
            {link.description && (
              <p className="text-stone-500 text-sm mt-0.5 line-clamp-2">
                {link.description}
              </p>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full font-medium">
            {CATEGORY_EMOJIS[link.category] || '📦'} {link.category}
          </span>
          <span className="text-xs text-stone-400">{hostname}</span>
          <span className="text-xs text-stone-400 ml-auto">{timeAgo(link.created_at)}</span>
        </div>
      </a>

      {/* Actions */}
      <div className="flex border-t border-stone-100">
        {mode === 'received' ? (
          <button
            onClick={() => onToggleRead(link.id, !link.is_read)}
            className="flex-1 py-3 text-sm font-medium transition-colors text-center rounded-bl-2xl"
            style={{ color: link.is_read ? '#78716c' : '#10b981' }}
          >
            {link.is_read ? '↩ Marcar sin leer' : '✓ Marcar como leído'}
          </button>
        ) : (
          <div className="flex-1 py-3 text-sm text-stone-400 text-center">
            {link.other_read ? '👀 Ya lo vio' : '⏳ Esperando...'}
          </div>
        )}
        <div className="w-px bg-stone-100" />
        {confirmDelete ? (
          <div className="flex flex-1">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-3 text-sm font-medium text-stone-500 text-center"
            >
              Cancelar
            </button>
            <div className="w-px bg-stone-100" />
            <button
              onClick={() => onDelete(link.id)}
              className="flex-1 py-3 text-sm font-medium text-red-500 text-center rounded-br-2xl"
            >
              Borrar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 py-3 text-sm font-medium text-stone-400 hover:text-red-400 transition-colors text-center rounded-br-2xl"
          >
            🗑 Borrar
          </button>
        )}
      </div>
    </div>
  )
}
