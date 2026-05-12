import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const subscription = await request.json()

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_role: session.user.role,
      subscription,
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
