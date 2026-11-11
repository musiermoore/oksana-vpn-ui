import test from 'node:test';
import assert from 'node:assert/strict';
import { apiBaseUrlForPath } from '../src/lib/apiUrls.js';

const miniAppApi = 'https://panel.oksana1984.ru/telegram-app';
const authApi = 'https://api.oksana1984.ru/api/v1';

test('authentication and profile operations use the dedicated API URL', () => {
    const paths = [
        'auth/telegram', 'auth/login', 'auth/me', 'auth/logout', 'auth/credentials',
        'auth/telegram/oidc/start', 'auth/telegram/oidc/exchange',
    ];

    for (const path of paths) {
        assert.equal(apiBaseUrlForPath(path, miniAppApi, authApi), authApi);
    }
});

test('registration and other Mini App operations use the Mini App API base', () => {
    const paths = [
        'auth/register', 'diagnostics/bootstrap',
        'subscription-packages', 'referrals/claim', 'giveaway/current', 'giveaway/summary',
        'giveaway/participate', 'payments/subscriptions', 'payments/subscription-codes/activate',
        'wireguard/configs', 'wireguard/configs/abc/download', 'wireguard/configs/abc/qr-code',
        'wireguard/configs/abc/send-file', 'wireguard/configs/abc/send-qr', 'vless/link',
        'vless/qr-code', 'vless/send-qr', 'vless-wl/link', 'vless-wl/qr-code', 'vless-wl/send-qr',
        'support/tickets', 'support/options', 'support/tickets/1',
        'support/tickets/1/attachments/2/0', 'support/tickets/1/messages',
    ];

    for (const path of paths) {
        assert.equal(apiBaseUrlForPath(path, miniAppApi, authApi), miniAppApi);
    }
});
