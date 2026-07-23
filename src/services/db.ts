import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mock'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')

export const db = isMock
  ? (mockSupabase as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl, supabaseAnonKey)
