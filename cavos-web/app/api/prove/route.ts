/**
 * ZK Login Proving Service
 *
 * POST /api/prove
 *
 * Generates a Groth16 ZK proof for JWT authentication.
 * This proves that:
 * 1. The JWT is valid and signed by Google/Apple
 * 2. The nonce in the JWT matches the ephemeral public key
 * 3. The address_seed is correctly derived from the JWT claims
 *
 * The backend only sees the ephemeral PUBLIC key, never the private key.
 * This means the backend cannot sign transactions - it's non-custodial.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateProof, checkProverHealth, ProveRequest } from '@/lib/prover';

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { jwt, ephPublicKey, maxBlock, randomness, salt } = body as Partial<ProveRequest>;

    if (!jwt || typeof jwt !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid jwt parameter',
          code: 'INVALID_JWT',
        },
        { status: 400 }
      );
    }

    if (
      !ephPublicKey ||
      !Array.isArray(ephPublicKey) ||
      ephPublicKey.length !== 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid ephPublicKey parameter (expected array of 2 strings)',
          code: 'INVALID_EPH_PUBLIC_KEY',
        },
        { status: 400 }
      );
    }

    if (!maxBlock || typeof maxBlock !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid maxBlock parameter',
          code: 'INVALID_MAX_BLOCK',
        },
        { status: 400 }
      );
    }

    if (!randomness || typeof randomness !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid randomness parameter',
          code: 'INVALID_RANDOMNESS',
        },
        { status: 400 }
      );
    }

    if (!salt || typeof salt !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid salt parameter',
          code: 'INVALID_SALT',
        },
        { status: 400 }
      );
    }

    // Validate JWT format (basic check)
    const jwtParts = jwt.split('.');
    if (jwtParts.length !== 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JWT format',
          code: 'INVALID_JWT_FORMAT',
        },
        { status: 400 }
      );
    }

    // Decode JWT header to check algorithm
    try {
      const headerB64 = jwtParts[0].replace(/-/g, '+').replace(/_/g, '/');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
      if (header.alg !== 'RS256') {
        return NextResponse.json(
          {
            success: false,
            error: 'Only RS256 algorithm is supported',
            code: 'UNSUPPORTED_ALGORITHM',
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to decode JWT header',
          code: 'INVALID_JWT_HEADER',
        },
        { status: 400 }
      );
    }

    // Decode JWT payload to validate issuer
    try {
      const payloadB64 = jwtParts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());

      // Validate issuer (only Google and Apple supported)
      const validIssuers = [
        'https://accounts.google.com',
        'https://appleid.apple.com',
      ];
      if (!validIssuers.includes(payload.iss)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported issuer: ${payload.iss}. Only Google and Apple are supported.`,
            code: 'UNSUPPORTED_ISSUER',
          },
          { status: 400 }
        );
      }

      // Check if JWT is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return NextResponse.json(
          {
            success: false,
            error: 'JWT has expired',
            code: 'JWT_EXPIRED',
          },
          { status: 400 }
        );
      }

      // Check required claims
      if (!payload.sub) {
        return NextResponse.json(
          {
            success: false,
            error: 'JWT missing required "sub" claim',
            code: 'MISSING_SUB_CLAIM',
          },
          { status: 400 }
        );
      }

      if (!payload.nonce) {
        return NextResponse.json(
          {
            success: false,
            error: 'JWT missing required "nonce" claim',
            code: 'MISSING_NONCE_CLAIM',
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to decode JWT payload',
          code: 'INVALID_JWT_PAYLOAD',
        },
        { status: 400 }
      );
    }

    // Check prover health
    const health = checkProverHealth();
    if (!health.ready) {
      return NextResponse.json(
        {
          success: false,
          error: 'Proving service not ready. Circuit files missing.',
          code: 'PROVER_NOT_READY',
          details: health,
        },
        { status: 503 }
      );
    }

    // Generate proof
    console.log('Generating ZK proof...');
    const startTime = Date.now();

    const result = await generateProof({
      jwt,
      ephPublicKey: ephPublicKey as [string, string],
      maxBlock,
      randomness,
      salt,
    });

    const duration = Date.now() - startTime;
    console.log(`Proof generation completed in ${duration}ms`);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Proof generation failed',
          code: 'PROOF_GENERATION_FAILED',
        },
        { status: 500 }
      );
    }

    // Return proof and public inputs
    return NextResponse.json({
      success: true,
      proof: {
        garaga: result.garaga,
        publicInputs: result.publicInputs,
        allInputsHash: result.allInputsHash,
      },
      accountAddress: result.accountAddress,
      duration,
    });
  } catch (error) {
    console.error('Proving service error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/prove
 *
 * Health check endpoint
 */
export async function GET() {
  const health = checkProverHealth();

  return NextResponse.json({
    status: health.ready ? 'ready' : 'not_ready',
    ...health,
  });
}
