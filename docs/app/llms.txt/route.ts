import { source } from '@/lib/source';
import { LLMS_HEADERS, LLMS_PREAMBLE } from '@/lib/llms';
import { llms } from 'fumadocs-core/source';

export const revalidate = false;

export function GET() {
  return new Response(LLMS_PREAMBLE + llms(source).index(), {
    headers: LLMS_HEADERS,
  });
}
