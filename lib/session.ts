import { getIronSession, IronSessionData } from 'iron-session'
import { cookies } from 'next/headers'

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      name: string
      role: 'husband' | 'wife'
    }
  }
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'linkshare-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  },
}

export async function getSession() {
  return getIronSession<IronSessionData>(cookies(), sessionOptions)
}
