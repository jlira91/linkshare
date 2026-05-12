import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const updateData: Record<string, unknown> = {}

  if (typeof body.is_read === 'boolean') {
    const isHusband = session.user.role === 'husband'
    const readField = isHusband ? 'read_by_husband' : 'read_by_wife'
    const timeField = isHusband ? 'read_at_husband' : 'read_at_wife'
    updateData[readField] = body.is_read
    updateData[timeField] = body.is_read ? new Date().toISOString() : null
  }

  const { data, error } = await supabase
    .from('links')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const isHusband = session.user.role === 'husband'
  return NextResponse.json({
    id: data.id,
    url: data.url,
    title: data.title,
    description: data.description,
    category: data.category,
    added_by: data.added_by ?? 'husband',
    is_read: isHusband ? (data.read_by_husband ?? false) : (data.read_by_wife ?? false),
    other_read: isHusband ? (data.read_by_wife ?? false) : (data.read_by_husband ?? false),
    my_read_at: isHusband ? data.read_at_husband : data.read_at_wife,
    created_at: data.created_at,
    image_url: data.image_url ?? '',
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { error } = await supabase.from('links').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
