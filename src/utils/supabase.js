import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bmwkuxahwsbeshowqlkq.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_9fM1opq1rzPsnbQv3o9Ciw_3L6pETqB';

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
