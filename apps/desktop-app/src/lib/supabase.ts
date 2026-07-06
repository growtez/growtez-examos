import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjvuwujfhqujewbuyikv.supabase.co';
const supabaseAnonKey = 'sb_publishable_i1hGkK-Ad5AHl_bpbCplmQ_eo7Q0EHU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
