import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildVlessLinkApiUrl,
    normalizeVlessLinkResponse,
    VLESS_LINK_API_PATH,
} from '../src/lib/vlessLink.js';

const goApiBaseUrl = 'https://api.oksana1984.ru/api/v1';

test('VLESS links map to the authenticated Go API endpoint', () => {
    assert.equal(VLESS_LINK_API_PATH, 'vless/link');
    assert.equal(
        buildVlessLinkApiUrl(goApiBaseUrl, VLESS_LINK_API_PATH),
        'https://api.oksana1984.ru/api/v1/vless/link',
    );
});

test('VLESS link response reads the Go API deep links and raw link flag', () => {
    const response = {
        happ_deep_link: 'https://connect.example/deep-link/happ?token=abc',
        incy_deep_link: 'https://connect.example/deep-link/incy?token=abc',
        v2raytun_deep_link: 'https://connect.example/deep-link/v2raytun?token=abc',
        show_raw_link: false,
    };

    assert.deepEqual(normalizeVlessLinkResponse(response), response);
    assert.equal(normalizeVlessLinkResponse({ ...response, show_raw_link: true }).show_raw_link, true);
    assert.deepEqual(normalizeVlessLinkResponse(null), {
        happ_deep_link: '',
        incy_deep_link: '',
        v2raytun_deep_link: '',
        show_raw_link: false,
    });
});
