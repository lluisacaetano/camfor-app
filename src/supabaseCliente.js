import { createClient } from '@supabase/supabase-js'

// Use variáveis de ambiente (.env)
const supabaseUrl = 'https://mbdeqjhoufhfzqpiifys.supabase.co'
const supabaseKey = 'sb_publishable_b97ciu6JKI0OPnYCqgSSRQ_S0wdjEQK'

export const supabase = createClient(supabaseUrl, supabaseKey)