import { readFile } from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog';

const BRAND = '#402AFF';
const PAPER = '#FFFFFF';

// Logo mark source is 51x63.
const MARK_HEIGHT = 28;
const MARK_WIDTH = Math.round((MARK_HEIGHT * 51) / 63);

const APP_ROOTS = [process.cwd(), path.join(process.cwd(), 'cavos-web')];

async function readAsset(relative: string): Promise<Buffer> {
  for (const root of APP_ROOTS) {
    try {
      return await readFile(path.join(root, relative));
    } catch {
      // try the next root
    }
  }
  throw new Error(`OG asset not found: ${relative}`);
}

/** Pull quote for a post card: explicit ogQuote, else the excerpt. */
export function blogOgQuote(meta: { ogQuote?: string; excerpt: string }): string {
  return (meta.ogQuote || meta.excerpt).trim();
}

function quoteFontSize(quote: string): number {
  const n = quote.length;
  if (n <= 55) return 76;
  if (n <= 80) return 64;
  if (n <= 110) return 54;
  return 46;
}

export async function renderBlogQuoteOg(slug: string): Promise<ImageResponse> {
  const post = getPostBySlug(slug);
  const quote = post ? blogOgQuote(post.meta) : 'Notes on embedded wallets.';
  const size = quoteFontSize(quote);

  const [sansMedium, mark] = await Promise.all([
    readAsset('app/fonts/og/Geist-Medium.ttf'),
    readAsset('public/cavos-mark-white.png'),
  ]);
  const markSrc = `data:image/png;base64,${mark.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: BRAND,
          color: PAPER,
          padding: '64px 104px',
          fontFamily: 'Geist',
        }}
      >
        <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              position: 'relative',
              fontSize: size,
              fontWeight: 500,
              lineHeight: 1.04,
              letterSpacing: '-0.045em',
              maxWidth: 960,
            }}
          >
            {/* Hanging open quote keeps the text block flush left. */}
            <span style={{ position: 'absolute', left: -0.4 * size, top: 0 }}>“</span>
            <span style={{ textWrap: 'balance' }}>{`${quote}”`}</span>
          </div>
        </div>
        {/* Satori renders plain img; next/image does not apply here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markSrc} width={MARK_WIDTH} height={MARK_HEIGHT} alt="" />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Geist', data: sansMedium, weight: 500, style: 'normal' }],
    },
  );
}
