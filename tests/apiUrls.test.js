import test from 'node:test';
import assert from 'node:assert/strict';
import { apiBaseUrlForPath } from '../src/lib/apiUrls.js';

const base = 'https://panel.oksana1984.ru/telegram-app';
const auth = 'https://api.oksana1984.ru/api/v1';

test('only the three auth paths use the separate API', () => {
    for (const path of ['auth/me', 'auth/telegram', 'auth/login']) {
        assert.equal(apiBaseUrlForPath(path, base, auth), auth);
    }

    for (const path of ['me', 'auth/register', 'subscription-packages', 'payments/subscriptions', 'support/tickets', 'diagnostics/bootstrap']) {
        assert.equal(apiBaseUrlForPath(path, base, auth), base);
    }
});
