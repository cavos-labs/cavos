import { LLMS_HEADERS, LLMS_PREAMBLE } from '@/lib/llms';
import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(LLMS_PREAMBLE + scanned.join('\n\n'), {
    headers: LLMS_HEADERS,
  });
}
