// Path: app/api/auth/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client, driveScopes } from '@/lib/google-auth';
import { AuthStatePayload } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const alias = searchParams.get('alias');

  if (!alias) {
    return NextResponse.json({ error: 'Parameter alias drive diperlukan' }, { status: 400 });
  }

  // Kita gunakan parameter 'state' untuk membawa data alias ke callback OAuth
  // karena Google akan mengembalikan state ini persis seperti kita mengirimnya
  const statePayload: AuthStatePayload = { alias };
  const stateString = Buffer.from(JSON.stringify(statePayload)).toString('base64');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // WAJIB: Agar Google memberikan refresh_token
    prompt: 'consent',      // WAJIB: Memaksa layar persetujuan agar refresh_token selalu di-generate ulang
    scope: driveScopes,
    state: stateString,
  });

  return NextResponse.redirect(authUrl);
}