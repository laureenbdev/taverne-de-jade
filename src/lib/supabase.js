import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY

function createSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) return null

  try {
    return createClient(supabaseUrl, supabaseKey)
  } catch {
    return null
  }
}

export const supabase = createSupabaseClient()
