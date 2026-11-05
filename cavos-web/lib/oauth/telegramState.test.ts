import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { openTelegramState, redirectDigest, registeredRedirect, signTelegramState } from './telegramState';

process.env.OAUTH_STATE_SECRET = 'test-state-secret';

const APP = '0f9d5a1c-3b2e-4c5a-8d7f-1a2b3c4d5e6f';
const ENV = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const REDIRECT = `https://app.example.com/${'deep/'.repeat(40)}callback?return=${'x'.repeat(200)}`;

describe('signTelegramState', () => {
    it('stays within Telegram\'s 256-character limit whatever the redirect', () => {
        const state = signTelegramState({ appId: APP, environmentId: ENV, redirectUri: REDIRECT });
        assert.ok(state.length <= 256, `state is ${state.length} characters`);
        assert.match(state, /^t1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it('round-trips the app, the environment and the redirect digest', () => {
        const opened = openTelegramState(signTelegramState({ appId: APP, environmentId: ENV, redirectUri: REDIRECT }));
        assert.equal(opened.appId, APP);
        assert.equal(opened.environmentId, ENV);
        assert.deepEqual(opened.redirectDigest, redirectDigest(REDIRECT));
    });

    it('carries a missing environment as null', () => {
        const opened = openTelegramState(signTelegramState({ appId: APP, environmentId: null, redirectUri: REDIRECT }));
        assert.equal(opened.environmentId, null);
    });

    it('normalizes uppercase UUIDs to lowercase', () => {
        const opened = openTelegramState(
            signTelegramState({ appId: APP.toUpperCase(), environmentId: null, redirectUri: REDIRECT }),
        );
        assert.equal(opened.appId, APP);
    });

    it('refuses ids that are not UUIDs', () => {
        assert.throws(() => signTelegramState({ appId: 'app', environmentId: null, redirectUri: REDIRECT }));
        assert.throws(() => signTelegramState({ appId: APP, environmentId: 'env', redirectUri: REDIRECT }));
    });
});

describe('openTelegramState', () => {
    const state = signTelegramState({ appId: APP, environmentId: ENV, redirectUri: REDIRECT }, 1_000_000);

    it('refuses a state with a changed body or signature', () => {
        const [version, body, mac] = state.split('.');
        const flipped = body.slice(0, 5) + (body[5] === 'A' ? 'B' : 'A') + body.slice(6);
        for (const forged of [
            `${version}.${flipped}.${mac}`,
            `${version}.${body}.${mac.slice(0, -2)}AA`,
            `${version}.${body}.`,
            `v1.${body}.${mac}`,
            `${version}.${body}`,
            `${state}.extra`,
            '',
        ]) {
            assert.throws(() => openTelegramState(forged, 1_000_000), forged);
        }
    });

    it('refuses a state signed under another secret', () => {
        process.env.OAUTH_STATE_SECRET = 'another-secret';
        try {
            assert.throws(() => openTelegramState(state, 1_000_000));
        } finally {
            process.env.OAUTH_STATE_SECRET = 'test-state-secret';
        }
    });

    it('refuses a state older than ten minutes or from the future', () => {
        assert.doesNotThrow(() => openTelegramState(state, 1_000_000 + 9 * 60_000));
        assert.throws(() => openTelegramState(state, 1_000_000 + 11 * 60_000));
        assert.throws(() => openTelegramState(state, 1_000_000 - 60_000));
    });
});

describe('registeredRedirect', () => {
    it('finds the registered callback the digest names, and nothing else', () => {
        const callbacks = ['https://app.example.com/a', REDIRECT, 'https://app.example.com/b'];
        assert.equal(registeredRedirect(callbacks, redirectDigest(REDIRECT)), REDIRECT);
        assert.equal(registeredRedirect(callbacks, redirectDigest('https://evil.example.com/')), null);
        assert.equal(registeredRedirect([], redirectDigest(REDIRECT)), null);
    });
});
