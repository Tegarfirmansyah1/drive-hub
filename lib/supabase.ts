// Path: lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Peringatan: Variabel environment Supabase belum diatur.');
}

// Inisialisasi client tunggal untuk digunakan di seluruh backend
export const supabase = createClient(supabaseUrl, supabaseKey);