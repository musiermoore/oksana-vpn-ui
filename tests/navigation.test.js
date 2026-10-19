import test from 'node:test';
import assert from 'node:assert/strict';

const calls = [];
globalThis.window = {
    location: {
        href: 'https://public.oksana1984.ru/',
        origin: 'https://public.oksana1984.ru',
        pathname: '/',
        search: '',
        assign: (url) => calls.push(['external', url]),
    },
    history: {
        pushState: (_state, _unused, url) => updateLocation('push', url),
        replaceState: (_state, _unused, url) => updateLocation('replace', url),
    },
    addEventListener: () => {},
    scrollTo: () => {},
};

function updateLocation(kind, url) {
    const parsed = new URL(url);
    window.location.href = parsed.href;
    window.location.pathname = parsed.pathname;
    window.location.search = parsed.search;
    calls.push([kind, parsed.href]);
}

const { currentRoute, navigate } = await import('../src/lib/navigation.js');

test('internal navigation updates SPA route and preserves query', () => {
    navigate('/wireguard?step=list');
    assert.deepEqual(currentRoute.value, { pathname: '/wireguard', search: '?step=list' });
    assert.deepEqual(calls.at(-1), ['push', 'https://public.oksana1984.ru/wireguard?step=list']);
});

test('deep link replacement does not add browser history', () => {
    navigate('/support/42', { replace: true });
    assert.deepEqual(currentRoute.value, { pathname: '/support/42', search: '' });
    assert.deepEqual(calls.at(-1), ['replace', 'https://public.oksana1984.ru/support/42']);
});

test('external navigation leaves the SPA', () => {
    navigate('https://payment.example.test/checkout');
    assert.deepEqual(calls.at(-1), ['external', 'https://payment.example.test/checkout']);
});
