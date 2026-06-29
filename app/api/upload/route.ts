import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { oauth2Client } from '@/lib/google-auth';
import { supabase } from '@/lib/supabase';
import { decryptToken } from '@/lib/encryption';
import { Readable } from 'stream';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const driveId = formData.get('driveId') as string;

    if (!file || !driveId) {
      return NextResponse.json({ error: 'File atau Drive ID tidak ditemukan' }, { status: 400 });
    }

    // 1. Ambil token enkripsi dari database
    const { data: driveAccount, error } = await supabase
      .from('connected_drives')
      .select('encrypted_refresh_token')
      .eq('id', driveId)
      .single();

    if (error || !driveAccount) {
      return NextResponse.json({ error: 'Akun Drive tidak ditemukan' }, { status: 404 });
    }

    // 2. Dekripsi token (Gunakan fungsi decrypt Anda di sini)
    const refreshToken = decryptToken(driveAccount.encrypted_refresh_token);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // 3. Inisialisasi Drive API
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // 4. Upload File
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer); // Mengubah buffer menjadi Readable stream

    const response = await drive.files.create({
      requestBody: { name: file.name },
      media: { 
        body: stream, // Gunakan stream, bukan buffer langsung
        mimeType: file.type 
      },
    });

    return NextResponse.json({ success: true, fileId: response.data.id });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah file' }, { status: 500 });
  }
}