import { NextRequest, NextResponse } from 'next/server';
import {
  ENCLAVE_RELEASES_REPO,
  findBundleAssetUrl,
  isValidPcr0,
  ReleaseSummary,
} from '@/lib/enclave/releases';

/**
 * Serves the Sigstore bundle of an enclave release so browsers can fetch it.
 *
 * GitHub release assets carry no CORS headers, so a browser cannot download them
 * directly. This route only relays the bytes. The host is untrusted: @cavos/kit
 * verifies the bundle's Sigstore signature, its Rekor inclusion and the signing
 * identity itself, so a tampered or substituted bundle is rejected client-side.
 *
 * Optional env var:
 * - GITHUB_TOKEN: raises the GitHub API rate limit; the route works without it
 */

const LIST_REVALIDATE_SECONDS = 300;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
};

function githubHeaders(accept: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'cavos-web',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

function error(code: string, status: number, cacheControl?: string) {
  return NextResponse.json(
    { error: code },
    {
      status,
      headers: { ...CORS_HEADERS, ...(cacheControl ? { 'Cache-Control': cacheControl } : {}) },
    }
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pcr0: string }> }
) {
  const { pcr0 } = await params;
  if (!isValidPcr0(pcr0)) return error('invalid_pcr0', 400);

  try {
    const list = await fetch(
      `https://api.github.com/repos/${ENCLAVE_RELEASES_REPO}/releases?per_page=100`,
      {
        headers: githubHeaders('application/vnd.github+json'),
        next: { revalidate: LIST_REVALIDATE_SECONDS },
      }
    );
    if (!list.ok) return error('release_unavailable', 502);

    const releases = (await list.json()) as ReleaseSummary[];
    if (!Array.isArray(releases)) return error('release_unavailable', 502);

    const assetUrl = findBundleAssetUrl(releases, pcr0);
    if (!assetUrl) return error('release_not_found', 404, 'public, max-age=60');

    const asset = await fetch(assetUrl, {
      headers: githubHeaders('application/octet-stream'),
      redirect: 'follow',
    });
    if (!asset.ok) return error('release_unavailable', 502);

    let bundle: unknown;
    try {
      bundle = JSON.parse(await asset.text());
    } catch {
      return error('release_unavailable', 502);
    }

    return NextResponse.json(bundle, {
      headers: {
        ...CORS_HEADERS,
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch {
    return error('release_unavailable', 502);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
