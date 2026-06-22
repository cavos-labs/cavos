// Client-side card tokenization for Onvo.
//
// The raw card data goes straight from the browser to Onvo using the
// publishable key and NEVER touches our server. The server only ever sees the
// resulting payment-method `id`, which it attaches to a subscription.
//
// Adapted from framezz/vigilant-goggles/lib/onvopay-client.ts (card flow).
// SINPE Móvil is dropped — Cavos is card-only at launch.

const ONVO_BASE_URL =
  process.env.NEXT_PUBLIC_ONVO_BASE_URL ?? 'https://api.onvopay.com/v1'

export type CardInput = {
  number: string
  /** MMYY or MM/YY — normalized internally. */
  expiry: string
  cvc: string
  holderName: string
  email: string
  customerId?: string
}

export class OnvoTokenizeError extends Error {}

function parseExpiry(expiry: string): { expMonth: number; expYear: number } | null {
  const digits = expiry.replace(/\D/g, '')
  if (digits.length !== 4) return null
  const expMonth = Number(digits.slice(0, 2))
  const expYear = 2000 + Number(digits.slice(2, 4))
  if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) return null
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return null
  }
  return { expMonth, expYear }
}

export type TokenizedCard = {
  /** Payment-method id the server attaches to the Pro subscription. */
  paymentMethodId: string
  /** Customer id Onvo created/associated for this card, if returned. */
  customerId: string | null
}

/**
 * Tokenize a card with Onvo. Per the Onvo docs, `POST /v1/payment-methods` can
 * also create/associate a customer (passed as `customer`) and returns both the
 * payment-method `id` and a `customerId`. We surface both so checkout charges
 * the subscription against the customer this card belongs to.
 *
 * Raw card data goes browser→Onvo with the publishable key and never touches our
 * server. Throws `OnvoTokenizeError` on rejection.
 *
 * @param publicKey  NEXT_PUBLIC_ONVO_PUBLIC_KEY — safe to ship to the browser.
 * @param card       Raw card details. Never sent to our own server.
 */
export async function tokenizeOnvoCard(
  publicKey: string,
  card: CardInput,
): Promise<TokenizedCard> {
  const exp = parseExpiry(card.expiry)
  if (!exp) throw new OnvoTokenizeError('Invalid expiry')
  const number = card.number.replace(/\D/g, '')

  const res = await fetch(`${ONVO_BASE_URL}/payment-methods`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${publicKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      type: 'card',
      ...(card.customerId
        ? { customerId: card.customerId }
        : { customer: { name: card.holderName, email: card.email } }),
      card: {
        number,
        expMonth: exp.expMonth,
        expYear: exp.expYear,
        cvv: card.cvc,
        holderName: card.holderName,
      },
      billing: {
        name: card.holderName,
        email: card.email,
      },
    }),
  })

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    // ignore — handled by the !res.ok path
  }

  if (!res.ok) {
    throw new OnvoTokenizeError(errorMessage(data))
  }

  return { paymentMethodId: extractId(data), customerId: extractCustomerId(data) }
}

function extractCustomerId(data: unknown): string | null {
  if (data && typeof data === 'object' && 'customerId' in data) {
    const v = (data as { customerId: unknown }).customerId
    if (typeof v === 'string' && v.length > 0) return v
  }
  return null
}

function errorMessage(data: unknown): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message: unknown }).message
    if (Array.isArray(message)) return message.join(', ')
    return String(message)
  }
  return 'Payment method was rejected'
}

function extractId(data: unknown): string {
  const id =
    data && typeof data === 'object' && 'id' in data
      ? String((data as { id: unknown }).id)
      : ''
  if (!id) throw new OnvoTokenizeError('ONVO did not return a payment method id')
  return id
}
