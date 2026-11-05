import { createAdminClient } from '@/lib/supabase/admin';
import { decryptJson } from '@/lib/oauth/encryption';

export interface TelegramCredentials {
  botId: string;
  clientSecret: string;
}

/** The callback Telegram redirects to; it must be listed in the bot's Allowed URLs. */
export function telegramCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/oauth/telegram/callback`;
}

/** The Telegram authorization URL: code flow with PKCE, `openid profile` scope, nonce and state as given. */
export function telegramAuthorizationUrl(input: {
  botId: string;
  codeChallenge: string;
  nonce: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: input.botId,
    response_type: 'code',
    scope: 'openid profile',
    redirect_uri: telegramCallbackUrl(),
    code_challenge: input.codeChallenge,
    code_challenge_method: 'S256',
    nonce: input.nonce,
    state: input.state,
  });
  return `https://oauth.telegram.org/auth?${params.toString()}`;
}

/** True for a Telegram bot id: a positive decimal integer of at most 20 digits. */
export function isTelegramBotId(value: string): boolean {
  return /^[1-9][0-9]{0,19}$/.test(value);
}

/**
 * True for the shape of a Bot API token (`<bot id>:<35 characters>`). That token
 * controls the bot and is not the OIDC client secret; it must never be stored.
 */
export function looksLikeBotToken(value: string): boolean {
  return /^\d+:[A-Za-z0-9_-]{35}$/.test(value);
}

/**
 * The Telegram bot to use for an environment: its own, when the integrator
 * configured one, otherwise Cavos's from `TELEGRAM_BOT_ID` and
 * `TELEGRAM_CLIENT_SECRET`. The identity the enclave issues depends on the bot,
 * so the same Telegram user is a different user under different credentials.
 */
export async function telegramCredentials(environmentId: string | null): Promise<TelegramCredentials> {
  if (environmentId) {
    const { data, error } = await createAdminClient()
      .from('app_environments')
      .select('telegram_bot_id, telegram_client_secret_ciphertext')
      .eq('id', environmentId)
      .maybeSingle();
    if (error) throw new Error(`Could not load Telegram credentials: ${error.message}`);
    if (data?.telegram_bot_id && data.telegram_client_secret_ciphertext) {
      const secret = decryptJson(data.telegram_client_secret_ciphertext);
      if (typeof secret !== 'string' || !secret) throw new Error('Stored Telegram client secret is invalid');
      return { botId: data.telegram_bot_id, clientSecret: secret };
    }
  }
  const botId = process.env.TELEGRAM_BOT_ID;
  const clientSecret = process.env.TELEGRAM_CLIENT_SECRET;
  if (!botId || !clientSecret) {
    throw new Error('Telegram login is not configured. Set TELEGRAM_BOT_ID and TELEGRAM_CLIENT_SECRET.');
  }
  if (!isTelegramBotId(botId)) throw new Error('TELEGRAM_BOT_ID is not a Telegram bot id');
  return { botId, clientSecret };
}
