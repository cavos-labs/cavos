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

interface ReleaseList {
  releases: ReleaseSummary[];
  fetchedAt: number;
}

/**
 * Lists the published releases. `fetchedAt` is when GitHub answered, which for a
 * response served from the data cache is earlier than now.
 */
async function listReleases(cache: RequestInit): Promise<ReleaseList | null> {
  const response = await fetch(
    `https://api.github.com/repos/${ENCLAVE_RELEASES_REPO}/releases?per_page=100`,
    { headers: githubHeaders('application/vnd.github+json'), ...cache }
  );
  if (!response.ok) return null;

  const releases = (await response.json()) as ReleaseSummary[];
  if (!Array.isArray(releases)) return null;

  return { releases, fetchedAt: Date.parse(response.headers.get('date') ?? '') };
}

/**
 * The data cache answers with the previous list while it revalidates, so a list
 * past its window may predate the newest release.
 */
function isStale(fetchedAt: number): boolean {
  return !(Date.now() - fetchedAt < LIST_REVALIDATE_SECONDS * 1000);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pcr0: string }> }
) {
  const { pcr0 } = await params;
  if (!isValidPcr0(pcr0)) return error('invalid_pcr0', 400);

  try {
    const cached = await listReleases({ next: { revalidate: LIST_REVALIDATE_SECONDS } });
    if (!cached) return error('release_unavailable', 502);

    let assetUrl = findBundleAssetUrl(cached.releases, pcr0);
    if (!assetUrl && isStale(cached.fetchedAt)) {
      const fresh = await listReleases({ cache: 'no-store' });
      if (!fresh) return error('release_unavailable', 502);
      assetUrl = findBundleAssetUrl(fresh.releases, pcr0);
    }
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
