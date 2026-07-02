import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client } from '@/lib/google-auth';
import { google } from 'googleapis';
import { encryptToken } from '@/lib/encryption';
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
    return NextResponse.redirect(new URL('/dashboard?error=permintaan_tidak_valid', request.url));
  }

  try {
    // 1. Ekstrak 'alias' dan 'userId' dari parameter state
    const decodedStateString = Buffer.from(state, 'base64').toString('utf-8');
    const stateData = JSON.parse(decodedStateString);
    
    // DEKLARASI VARIABEL DI SINI agar terbaca oleh perintah insert di bawah
    const alias = stateData.alias;
    const userId = stateData.userId;

    if (!userId) {
      throw new Error("userId tidak ditemukan di dalam state payload");
    }

    // 2. Tukar kode otorisasi dengan token dari Google
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
       return NextResponse.redirect(new URL('/dashboard?error=refresh_token_tidak_ditemukan', request.url));
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
          user_id: userId, // Variabel userId sekarang sudah terdefinisi!
          alias_name: alias,
          email: email,
          encrypted_refresh_token: encryptedToken,
        }
      ]);

    if (adminDbError) {
      console.error('Error Database Supabase:', adminDbError);
      throw new Error('Gagal menyimpan data ke database');
    }

    // 6. Sukses, redirect kembali ke dashboard utama
    return NextResponse.redirect(new URL('/dashboard?success=true', request.url));

  } catch (error: unknown) {
    console.error('Error pada Callback OAuth:', error);
    return NextResponse.redirect(new URL('/dashboard?error=autentikasi_gagal', request.url));
  }
}