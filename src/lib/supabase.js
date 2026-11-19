import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || '').trim().replace(/\/+$/, '')
const supabaseKey = (process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || '').trim()

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) return null

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch {
    return null
  }
}

export const supabase = createSupabaseClient()
