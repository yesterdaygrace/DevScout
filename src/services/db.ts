import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mock'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')

// Fail closed: a production build without Supabase config must not silently fall back to the
// any-password demo login. Set VITE_ALLOW_MOCK=true to ship an intentional demo build.
if (isMock && import.meta.env.PROD && import.meta.env.VITE_ALLOW_MOCK !== 'true') {
  throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing). Refusing to start in demo mode.')
}

export const db = isMock
  ? (mockSupabase as unknown as ReturnType<typeof createClient>)
  : createClient(supabaseUrl, supabaseAnonKey, {
      // PKCE binds the OAuth callback to a verifier held by this browser; the implicit flow would
      // accept attacker-supplied #access_token fragments (login CSRF). AuthCallback.vue performs the
      // single code exchange itself, so URL auto-detection stays off.
      auth: { flowType: 'pkce', detectSessionInUrl: false },
    })
