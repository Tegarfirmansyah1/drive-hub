import { NextResponse } from 'next/server';
import { google } from 'googleapis'; // Tambahkan googleapis untuk manajemen folder
import { oauth2Client } from '@/lib/google-auth';
import { decryptToken } from '@/lib/encryption';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Tambahkan customPath untuk menerima input nama sub-folder dari frontend
    const { filename, mimeType, size, driveId, customPath } = body;

    if (!filename || !driveId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
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

    const { data: driveAccount, error } = await supabaseClient
      .from('connected_drives')
      .select('encrypted_refresh_token')
      .eq('id', driveId)
      .single();

    if (error || !driveAccount) {
      return NextResponse.json({ error: 'Akun Drive tidak ditemukan' }, { status: 404 });
    }

    const refreshToken = decryptToken(driveAccount.encrypted_refresh_token);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { token: accessToken } = await oauth2Client.getAccessToken();

    // --- LOGIKA MANAJEMEN FOLDER TERSTRUKTUR ---
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Selalu awali dengan folder utama "Drive Hub"
    const paths = ['Drive Hub']; 
    
    // Jika ada sub-folder custom (misal: "foto" atau "backup/2026"), pecah dan masukkan ke antrean
    if (customPath && customPath.trim() !== '') {
      const subFolders = customPath.split('/').filter((p: string) => p.trim() !== '');
      paths.push(...subFolders);
    }

    let currentParentId = 'root'; // Mulai pencarian dari root Drive

    for (const folderName of paths) {
      // 1. Cari apakah folder dengan nama ini sudah ada di dalam parent saat ini
      const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${currentParentId}' in parents and trashed=false`;
      const searchRes = await drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        // Folder sudah ada, gunakan ID-nya untuk pencarian folder anak berikutnya
        currentParentId = searchRes.data.files[0].id!;
      } else {
        // 2. Folder belum ada, buat baru
        const createRes = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentParentId]
          },
          fields: 'id'
        });
        currentParentId = createRes.data.id!;
      }
    }
    // Hasil akhir: currentParentId adalah ID dari folder terdalam tujuan upload
    // --- AKHIR LOGIKA FOLDER ---

    // Minta URL Sesi Resumable Upload ke Google Drive API
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType || 'application/octet-stream',
        'X-Upload-Content-Length': size.toString(),
        'Origin': origin
      },
      // Tambahkan 'parents' agar file langsung masuk ke dalam folder target
      body: JSON.stringify({ 
        name: filename,
        parents: [currentParentId] 
      })
    });

    const uploadUrl = response.headers.get('location');

    if (!uploadUrl) {
      throw new Error('Gagal mendapatkan upload URL dari Google');
    }

    return NextResponse.json({ uploadUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Gagal menginisialisasi sesi upload' }, { status: 500 });
  }
}