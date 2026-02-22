import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iysdacwmditzvgemcbom.supabase.co'
const supabaseKey = 'sb_publishable_EhcpD5NAW2MZjNAuGMsQfQ_z_zvyIzF'

export const supabase = createClient(supabaseUrl, supabaseKey)