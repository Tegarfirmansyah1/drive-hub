// Path: app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/google-auth';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import { encryptToken } from '@/lib/encryption';
import { AuthStatePayload } from '@/types';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Jika Google menolak atau format salah
  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=permintaan_tidak_valid', request.url));
  }

  try {
    // 1. Ekstrak 'alias' dari parameter state yang disandikan base64
    const decodedStateString = Buffer.from(state, 'base64').toString('utf-8');
    const stateData = JSON.parse(decodedStateString) as AuthStatePayload;
    const alias = stateData.alias;

    // 2. Tukar kode otorisasi dengan token dari Google
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
       // Catatan: Jika ini terjadi, biasanya karena prompt 'consent' tidak dikirim
       return NextResponse.redirect(new URL('/?error=refresh_token_tidak_ditemukan', request.url));
    }

    oauth2Client.setCredentials(tokens);

    // 3. Ambil informasi email akun Google tersebut
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      throw new Error('Google tidak memberikan akses ke alamat email');
    }

    // 4. Enkripsi refresh token sebelum disimpan
    const encryptedToken = encryptToken(tokens.refresh_token);

    // 5. Simpan ke database Supabase

    const { error: adminDbError } = await supabaseAdmin
  .from('connected_drives')
  .insert([
    {
      alias_name: alias,
      email: email,
      encrypted_refresh_token: encryptedToken,
    }
  ]);

    if (adminDbError) {
      console.error('Error Database Supabase:', adminDbError);
      throw new Error('Gagal menyimpan data ke database');
    }

    // 6. Sukses, redirect kembali ke dashboard utama dengan status sukses
    return NextResponse.redirect(new URL('/?success=true', request.url));

  } catch (error: unknown) {
    console.error('Error pada Callback OAuth:', error);
    return NextResponse.redirect(new URL('/?error=autentikasi_gagal', request.url));
  }
}