import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

function mapLink(link: Record<string, unknown>, isHusband: boolean) {
  return {
    id: link.id,
    url: link.url,
    title: link.title,
    description: link.description,
    category: link.category,
    added_by: (link.added_by as string) ?? 'husband',
    is_read: isHusband
      ? (link.read_by_husband as boolean ?? false)
      : (link.read_by_wife as boolean ?? false),
    other_read: isHusband
      ? (link.read_by_wife as boolean ?? false)
      : (link.read_by_husband as boolean ?? false),
    my_read_at: isHusband
      ? (link.read_at_husband as string | null)
      : (link.read_at_wife as string | null),
    created_at: link.created_at,
    image_url: (link.image_url as string) ?? '',
  }
}

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
  return NextResponse.json((data ?? []).map(l => mapLink(l, isHusband)))
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

  // Enviar notificación push a la otra persona
  try {
    const otherRole = session.user.role === 'husband' ? 'wife' : 'husband'
    const { data: subData } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_role', otherRole)
      .single()

    if (subData?.subscription) {
      const webpush = (await import('@/lib/webpush')).default
      await webpush.sendNotification(
        subData.subscription as Parameters<typeof webpush.sendNotification>[0],
        JSON.stringify({
          title: `${session.user.name} te mandó algo 💌`,
          body: title,
          url: '/links',
        })
      )
    }
  } catch {
    // No fallar si la notificación no llega
  }

  const isHusband = session.user.role === 'husband'
  return NextResponse.json(mapLink(data, isHusband))
}
