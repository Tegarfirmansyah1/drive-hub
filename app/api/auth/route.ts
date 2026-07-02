import { NextRequest, NextResponse } from 'next/server';
import { oauth2Client, driveScopes } from '@/lib/google-auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const alias = searchParams.get('alias');
  // Tangkap userId yang dikirim dari frontend
  const userId = searchParams.get('userId'); 

  if (!alias || !userId) {
    return NextResponse.redirect(new URL('/dashboard?error=permintaan_tidak_valid', request.url));
  }

  // Bungkus alias dan userId ke dalam objek state
  const statePayload = { alias, userId };
  const stateString = Buffer.from(JSON.stringify(statePayload)).toString('base64');

  // Generate URL Google OAuth
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: driveScopes,
    state: stateString,
    prompt: 'consent'
  });

  return NextResponse.redirect(authUrl);
}