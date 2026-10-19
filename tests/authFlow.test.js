import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateTelegramWithProvisioning } from '../src/lib/authFlow.js';

const authUrl = 'https://api.oksana1984.ru/api/v1/auth/telegram';
const provisioningUrl = 'https://panel.oksana1984.ru/telegram-app/auth/telegram';

test('existing Telegram user authenticates only through the auth API', async () => {
    const calls = [];
    const post = async (url, payload) => {
        calls.push([url, payload]);
        return { data: { token: 'token' } };
    };

    const response = await authenticateTelegramWithProvisioning(post, authUrl, provisioningUrl, 'init-data');

    assert.equal(response.data.token, 'token');
    assert.deepEqual(calls, [[authUrl, { init_data: 'init-data' }]]);
});

test('first-time Telegram user is provisioned on Laravel, then authenticated on the auth API', async () => {
    const calls = [];
    const post = async (url, payload) => {
        calls.push([url, payload]);
        if (calls.length === 1) throw { response: { status: 401, data: { error: 'User not found' } } };
        return { data: { token: 'token' } };
    };

    await authenticateTelegramWithProvisioning(post, authUrl, provisioningUrl, 'init-data');

    assert.deepEqual(calls.map(([url]) => url), [authUrl, provisioningUrl, authUrl]);
    assert.ok(calls.every(([, payload]) => payload.init_data === 'init-data'));
});

test('invalid Telegram data does not trigger Laravel provisioning', async () => {
    const calls = [];
    const error = { response: { status: 401, data: { error: 'Invalid data' } } };
    const post = async (url) => {
        calls.push(url);
        throw error;
    };

    await assert.rejects(authenticateTelegramWithProvisioning(post, authUrl, provisioningUrl, 'bad-data'), (caught) => caught === error);
    assert.deepEqual(calls, [authUrl]);
});
