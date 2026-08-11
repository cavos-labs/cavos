import { NextResponse } from 'next/server';

/** Deprecated: this legacy flow exposed provider credentials to browser URLs. */
export async function GET() {
  return NextResponse.json(
    { error: 'deprecated_endpoint', message: 'Use /api/oauth/google.' },
    { status: 410, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
