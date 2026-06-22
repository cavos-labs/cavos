import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactSalesEmail } from '@/lib/email/contact-sales';

const schema = z.object({
  workEmail: z.string().trim().email(),
  region: z.string().trim().min(1),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dialCode: z.string().trim().min(1).max(8),
  phone: z.string().trim().min(4).max(20),
  companyWebsite: z.string().trim().min(2).max(200),
  jobLevel: z.string().trim().min(1),
  jobFunction: z.string().trim().min(1),
  telegram: z.string().trim().max(80).optional().default(''),
  xHandle: z.string().trim().max(80).optional().default(''),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please check the form and try again.' },
        { status: 400 }
      );
    }

    await sendContactSalesEmail(parsed.data);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
