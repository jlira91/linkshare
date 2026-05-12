import { createClient } from '@supabase/supabase-js'

export type Link = {
  id: string
  url: string
  title: string
  description: string
  category: string
  added_by: string        // 'husband' | 'wife'
  is_read: boolean        // si el usuario actual lo leyó
  other_read: boolean     // si la otra persona lo leyó
  my_read_at: string | null  // cuándo lo leyó el usuario actual
  created_at: string
  image_url: string
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
