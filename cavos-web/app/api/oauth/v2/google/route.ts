import { NextRequest } from 'next/server';
import { GET as startGoogleOAuth } from '@/app/api/oauth/google/route';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/api/oauth/google';
  return startGoogleOAuth(new NextRequest(url, { headers: request.headers }));
}
