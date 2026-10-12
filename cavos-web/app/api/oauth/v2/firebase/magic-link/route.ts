import { NextRequest } from 'next/server';
import { POST as sendMagicLink } from '@/app/api/oauth/firebase/magic-link/route';

export async function POST(request: NextRequest) {
  return sendMagicLink(request);
}
