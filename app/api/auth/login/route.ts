import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  const { role, password } = await request.json()

  const husbandPassword = process.env.HUSBAND_PASSWORD
  const wifePassword = process.env.WIFE_PASSWORD
  const husbandName = process.env.HUSBAND_NAME || 'Jorge'
  const wifeName = process.env.WIFE_NAME || 'Mi Amor'

  let valid = false
  let name = ''

  if (role === 'husband' && password === husbandPassword) {
    valid = true
    name = husbandName
  } else if (role === 'wife' && password === wifePassword) {
    valid = true
    name = wifeName
  }

  if (!valid) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const session = await getSession()
  session.user = { name, role }
  await session.save()

  return NextResponse.json({ ok: true, name, role })
}
