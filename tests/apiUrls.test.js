import test from 'node:test';
import assert from 'node:assert/strict';
import { apiBaseUrlForPath } from '../src/lib/apiUrls.js';

const goApi = 'https://api.oksana1984.ru/api/v1';

test('all Mini App API operations use the versioned Go API base', () => {
    const paths = [
        'auth/telegram', 'auth/login', 'auth/register', 'auth/me', 'auth/logout', 'auth/credentials',
        'auth/telegram/oidc/start', 'auth/telegram/oidc/exchange', 'diagnostics/bootstrap',
        'subscription-packages', 'referrals/claim', 'giveaway/current', 'giveaway/summary',
        'giveaway/participate', 'payments/subscriptions', 'payments/subscription-codes/activate',
        'wireguard/configs', 'wireguard/configs/abc/download', 'wireguard/configs/abc/qr-code',
        'wireguard/configs/abc/send-file', 'wireguard/configs/abc/send-qr', 'vless/link',
        'vless/qr-code', 'vless/send-qr', 'vless-wl/link', 'vless-wl/qr-code', 'vless-wl/send-qr',
        'support/tickets', 'support/options', 'support/tickets/1',
        'support/tickets/1/attachments/2/0', 'support/tickets/1/messages',
    ];

    for (const path of paths) {
        assert.equal(apiBaseUrlForPath(path, goApi, 'https://panel.oksana1984.ru/telegram-app'), goApi);
    }
});
