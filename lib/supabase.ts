import { createClient } from '@supabase/supabase-js'

export type Link = {
  id: string
  url: string
  title: string
  description: string
  category: string
  is_read: boolean
  created_at: string
  read_at: string | null
  image_url: string
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
