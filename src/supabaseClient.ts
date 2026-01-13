import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://diugnhhojeuqbdpjjswy.supabase.co';
const supabaseKey = 'sb_publishable_gP6XbfMP_cix_c9HLg7Pvg_PqiUNfyW';

export const supabase = createClient(supabaseUrl, supabaseKey); 