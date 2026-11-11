import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateTelegram } from '../src/lib/authFlow.js';

const authUrl = 'https://api.oksana1984.ru/api/v1/auth/telegram';

test('Telegram authentication sends init data to Go once', async () => {
    const calls = [];
    const post = async (url, payload) => {
        calls.push([url, payload]);
        return { data: { token: 'token' } };
    };

    const response = await authenticateTelegram(post, authUrl, 'init-data');

    assert.equal(response.data.token, 'token');
    assert.deepEqual(calls, [[authUrl, { init_data: 'init-data' }]]);
});

test('Telegram authentication errors propagate without a Laravel fallback', async () => {
    const error = { response: { status: 401, data: { error: 'Invalid data' } } };
    const calls = [];
    const post = async (url) => {
        calls.push(url);
        throw error;
    };

    await assert.rejects(authenticateTelegram(post, authUrl, 'bad-data'), (caught) => caught === error);
    assert.deepEqual(calls, [authUrl]);
});
