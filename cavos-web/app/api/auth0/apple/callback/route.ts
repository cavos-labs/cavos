import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'deprecated_endpoint', message: 'This insecure legacy callback is disabled.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}
