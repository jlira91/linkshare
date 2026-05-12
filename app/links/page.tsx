import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import LinksClient from '@/components/LinksClient'

export default async function LinksPage() {
  const session = await getSession()
  if (!session.user) {
    redirect('/login')
  }

  return (
    <LinksClient
      userName={session.user.name}
      userRole={session.user.role}
    />
  )
}
