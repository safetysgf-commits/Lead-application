import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// IMPORTANT: Replace with your actual Supabase project URL and Anon Key
const supabaseUrl = 'https://wmkymfkvnzxbudovmbhx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indta3ltZmt2bnp4YnVkb3ZtYmh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Mzg2NjMsImV4cCI6MjA3OTAxNDY2M30.5qcB0rBtBNwQwg14gN6zcso8oF-l4uPqeC0e2GEyxG0';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
