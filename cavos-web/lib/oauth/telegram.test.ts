import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isTelegramBotId, looksLikeBotToken, telegramAuthorizationUrl, telegramCallbackUrl } from './telegram';

describe('isTelegramBotId', () => {
    it('accepts positive integers of up to 20 digits', () => {
        assert.equal(isTelegramBotId('1'), true);
        assert.equal(isTelegramBotId('123456789'), true);
        assert.equal(isTelegramBotId('9'.repeat(20)), true);
    });

    it('refuses everything else', () => {
        assert.equal(isTelegramBotId(''), false);
        assert.equal(isTelegramBotId('0'), false);
        assert.equal(isTelegramBotId('0123'), false);
        assert.equal(isTelegramBotId('9'.repeat(21)), false);
        assert.equal(isTelegramBotId('12a'), false);
        assert.equal(isTelegramBotId('-1'), false);
        assert.equal(isTelegramBotId('123\n'), false);
        assert.equal(isTelegramBotId('123456789:AAH' + 'a'.repeat(32)), false);
    });
});

describe('looksLikeBotToken', () => {
    const token = `123456789:${'A'.repeat(35)}`;

    it('recognises a Bot API token', () => {
        assert.equal(looksLikeBotToken(token), true);
        assert.equal(looksLikeBotToken(`1:${'a_-Z9'.repeat(7)}`), true);
    });

    it('does not match an OIDC client secret or a malformed token', () => {
        assert.equal(looksLikeBotToken('a'.repeat(43)), false);
        assert.equal(looksLikeBotToken(`123456789:${'A'.repeat(34)}`), false);
        assert.equal(looksLikeBotToken(`123456789:${'A'.repeat(36)}`), false);
        assert.equal(looksLikeBotToken(`abc:${'A'.repeat(35)}`), false);
        assert.equal(looksLikeBotToken(`${token}\n`), false);
        assert.equal(looksLikeBotToken(''), false);
    });
});

describe('telegramAuthorizationUrl', () => {
    const app = '0f9d5a1c-3b2e-4c5a-8d7f-1a2b3c4d5e6f';
    const hash = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

    it('builds the code-flow URL with the exact scope and the bound nonce', () => {
        const url = new URL(
            telegramAuthorizationUrl({ botId: '123456', codeChallenge: hash, nonce: `${app}.${hash}`, state: 'a.b' })
        );
        assert.equal(url.origin + url.pathname, 'https://oauth.telegram.org/auth');
        assert.equal(url.searchParams.get('client_id'), '123456');
        assert.equal(url.searchParams.get('response_type'), 'code');
        assert.equal(url.searchParams.get('scope'), 'openid profile');
        assert.equal(url.searchParams.get('redirect_uri'), telegramCallbackUrl());
        assert.equal(url.searchParams.get('code_challenge'), hash);
        assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
        assert.equal(url.searchParams.get('nonce'), `${app}.${hash}`);
        assert.equal(url.searchParams.get('state'), 'a.b');
    });

    it('encodes the scope space and the callback path', () => {
        const raw = telegramAuthorizationUrl({ botId: '1', codeChallenge: hash, nonce: 'n', state: 's' });
        assert.match(raw, /scope=openid\+profile|scope=openid%20profile/);
        assert.match(telegramCallbackUrl(), /\/api\/oauth\/telegram\/callback$/);
    });
});
