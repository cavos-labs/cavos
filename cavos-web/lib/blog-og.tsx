import { readFile } from 'fs/promises';
import path from 'path';
import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog';


const BRAND = '#402AFF';
const INK = '#0A0A0F';
const MUTED = '#555561';
const SURFACE = '#F7F7FB';
const LINE = '#E0E0E6';

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
  if (n <= 60) return 68;
  if (n <= 90) return 58;
  if (n <= 130) return 48;
  return 40;
}

export async function renderBlogQuoteOg(slug: string): Promise<ImageResponse> {
  const post = getPostBySlug(slug);
  const title = post?.meta.title ?? 'Cavos Blog';
  const category = post?.meta.category ?? 'Blog';
  const quote = post ? blogOgQuote(post.meta) : 'Notes on embedded wallets from Cavos.';

  const [display, sansMedium, sansRegular, logo] = await Promise.all([
    readAsset('app/fonts/Ramagothicbold.ttf'),
    readAsset('app/fonts/og/Geist-Medium.ttf'),
    readAsset('app/fonts/og/Geist-Regular.ttf'),
    readAsset('public/cavos-black.png'),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: SURFACE,
          padding: '64px 80px 56px',
          fontFamily: 'Geist',
          color: INK,
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: BRAND }} />
        <div
          style={{
            display: 'flex',
            fontFamily: 'Ramagothic',
            fontSize: 220,
            lineHeight: 1,
            color: BRAND,
            height: 120,
            marginLeft: -6,
          }}
        >
          “
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'flex-start',
            fontSize: quoteFontSize(quote),
            fontWeight: 500,
            lineHeight: 1.18,
            letterSpacing: '-0.025em',
            maxWidth: 1000,
          }}
        >
          {`${quote}”`}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${LINE}`,
            paddingTop: 28,
          }}
        >
          {/* Satori renders plain img; next/image does not apply here. */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} height={30} style={{ height: 30 }} alt="Cavos" />
            <span style={{ marginLeft: 12, fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>Cavos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: MUTED, maxWidth: 820 }}>
            <span style={{ color: BRAND, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 18 }}>
              {category}
            </span>
            <span style={{ margin: '0 14px', color: LINE }}>/</span>
            <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 640 }}>
              {title}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Ramagothic', data: display, weight: 700, style: 'normal' },
        { name: 'Geist', data: sansMedium, weight: 500, style: 'normal' },
        { name: 'Geist', data: sansRegular, weight: 400, style: 'normal' },
      ],
    },
  );
}
