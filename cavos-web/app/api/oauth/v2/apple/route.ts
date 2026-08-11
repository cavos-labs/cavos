import { NextRequest } from 'next/server';
import { GET as startAppleOAuth } from '@/app/api/oauth/apple/route';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/api/oauth/apple';
  url.searchParams.set('cavos_callback_mode', 'code');
  return startAppleOAuth(new NextRequest(url, { headers: request.headers }));
}
