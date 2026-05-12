import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const isHusband = session.user.role === 'husband'

  // Calcula is_read y other_read para el usuario actual
  const links = (data ?? []).map((link) => ({
    id: link.id,
    url: link.url,
    title: link.title,
    description: link.description,
    category: link.category,
    added_by: link.added_by ?? 'husband',
    is_read: isHusband ? (link.read_by_husband ?? false) : (link.read_by_wife ?? false),
    other_read: isHusband ? (link.read_by_wife ?? false) : (link.read_by_husband ?? false),
    created_at: link.created_at,
    image_url: link.image_url ?? '',
  }))

  return NextResponse.json(links)
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { url, title, description, category, image_url } = body

  if (!url || !title || !category) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('links')
    .insert({
      url,
      title,
      description: description || '',
      category,
      image_url: image_url || '',
      added_by: session.user.role,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const isHusband = session.user.role === 'husband'
  return NextResponse.json({
    ...data,
    added_by: data.added_by ?? session.user.role,
    is_read: isHusband ? (data.read_by_husband ?? false) : (data.read_by_wife ?? false),
    other_read: isHusband ? (data.read_by_wife ?? false) : (data.read_by_husband ?? false),
  })
}
