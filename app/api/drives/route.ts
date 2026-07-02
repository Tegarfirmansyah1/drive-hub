// Path: app/api/drives/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { DriveAccount } from '@/types';
import { google } from 'googleapis';
import { oauth2Client } from '@/lib/google-auth';
import { decryptToken } from '@/lib/encryption';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    // Ambil token dari header yang dikirim oleh Frontend
    const authHeader = request.headers.get('Authorization');
    
    // Inisialisasi Supabase client DENGAN token user (agar RLS berjalan)
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader || ''
          }
        }
      }
    );

    // Ambil data dari database
    const { data: dbDrives, error } = await supabaseClient
      .from('connected_drives')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drives from DB:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!dbDrives || dbDrives.length === 0) {
       return NextResponse.json([]);
    }

    // 2. Fetch usage/kuota untuk setiap drive dari Google API
    const drivesWithQuota = await Promise.all(
      dbDrives.map(async (drive: DriveAccount) => {
        try {
          // Dekripsi token untuk akun ini
          const refreshToken = decryptToken(drive.encrypted_refresh_token);
          
          // Buat instance OAuth client baru khusus untuk request ini
          // (Penting agar tidak terjadi race condition dengan request lain)
          const localOauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );
          
          localOauth2Client.setCredentials({ refresh_token: refreshToken });
          
          const driveApi = google.drive({ version: 'v3', auth: localOauth2Client });
          
          // Minta informasi storageQuota
          const aboutRes = await driveApi.about.get({
            fields: 'storageQuota'
          });

          const quotaInfo = aboutRes.data.storageQuota;
          
          if (quotaInfo) {
             const limit = parseInt(quotaInfo.limit || '0', 10);
             const usage = parseInt(quotaInfo.usage || '0', 10);
             const remaining = Math.max(0, limit - usage);

             // Hapus token terenkripsi sebelum dikirim ke frontend untuk keamanan ekstra
             const { encrypted_refresh_token, ...safeDriveData } = drive;

             return {
                ...safeDriveData,
                quota: {
                   total: limit,
                   used: usage,
                   remaining: remaining
                }
             };
          }
          
          // Fallback jika API tidak mengembalikan kuota
          const { encrypted_refresh_token, ...safeDriveData } = drive;
          return safeDriveData;

        } catch (apiError) {
           console.error(`Gagal mengambil kuota untuk drive ${drive.alias_name}:`, apiError);
           // Tetap kembalikan data drive meskipun gagal fetch kuota, agar tidak memecah list
           const { encrypted_refresh_token, ...safeDriveData } = drive;
           return safeDriveData;
        }
      })
    );

    return NextResponse.json(drivesWithQuota);
    
  } catch (globalError) {
    console.error('Global error in GET drives:', globalError);
    return NextResponse.json({ error: 'Terjadi kesalahan server internal' }, { status: 500 });
  }
}