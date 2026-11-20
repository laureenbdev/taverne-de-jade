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

/** Client jetable : ne touche pas à la session admin persistée. */
export function createEphemeralSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) return null

  const memoryStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }

  try {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: memoryStorage,
      },
    })
  } catch {
    return null
  }
}

export const supabase = createSupabaseClient()
