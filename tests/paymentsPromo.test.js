import test, { after, afterEach, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc';
import { createRenderer, createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

const require = createRequire(import.meta.url);
const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const quote = {
    code: 'TOLSTYD', benefit: 'percentage_discount', value: 20,
    discount_amount: 37.25, price: 173.25, payable_now: 53.25,
};
const quotes = {
    1: quote,
    3: { ...quote, discount_amount: 125.5, price: 621.75, payable_now: 381.75 },
    6: { ...quote, discount_amount: 240, price: 1200, payable_now: 720 },
    12: { ...quote, discount_amount: 455.75, price: 2164.25, payable_now: 1204.25 },
};
const packages = [
    { month: 0, days: 2, price: 0, payable_now: 0, is_trial: true },
    ...[1, 3, 6, 12].map((month) => ({
        month, price: 200 * month, payable_now: 120 * month, balance_applied: 80 * month, is_trial: false,
    })),
];
const renderer = createRenderer({
    createComment: () => ({}), insert() {}, remove() {},
    parentNode: () => null, nextSibling: () => null,
});
let Payments;
let api;
let endpoints;
let app;
let view;
let requests;
let respond;
let profileLoads;

const flushRequests = () => new Promise(setImmediate);
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((onResolve, onReject) => {
        resolve = onResolve;
        reject = onReject;
    });
    return { promise, resolve, reject };
};
const applyPromo = async () => {
    view.promoCode.value = ' tolstyd ';
    await view.applyPromo();
};
const renderPayments = () => {
    const application = createSSRApp({ ...Payments, setup: () => view });
    application.component('FontAwesomeIcon', { render: () => null });
    return renderToString(application);
};

before(async () => {
    globalThis.window = { location: new URL('https://mini.example/payments'), addEventListener() {} };
    globalThis.document = { title: '' };

    // Compile the real Vue component and API client in memory without a browser or test server.
    const bundle = await build({
        stdin: {
            contents: [
                "export { default as Payments } from './src/Pages/TelegramApp/Payments.vue';",
                "export { telegramMiniAppApi, telegramMiniAppEndpoints } from './src/lib/telegramMiniAppApi.js';",
            ].join('\n'),
            resolveDir: process.cwd(),
        },
        bundle: true, write: false, platform: 'node', format: 'esm',
        define: { 'import.meta.env': JSON.stringify({ VITE_API_BASE_URL: 'https://mini.example/api', API_URL: 'https://auth.example/api' }) },
        plugins: [{
            name: 'vue-component-test',
            setup(builder) {
                builder.onResolve({ filter: /^[^./]/ }, ({ path }) => ({
                    path: pathToFileURL(require.resolve(path)).href, external: true,
                }));
                builder.onLoad({ filter: /\.vue$/ }, async ({ path }) => {
                    const { descriptor } = parse(await readFile(path, 'utf8'), { filename: path });
                    const script = compileScript(descriptor, { id: path, genDefaultAs: 'component' });
                    const template = compileTemplate({
                        source: descriptor.template.content, filename: path, id: path,
                        ssr: true, ssrCssVars: [], compilerOptions: { bindingMetadata: script.bindings },
                    });
                    assert.deepEqual(template.errors, []);
                    return { contents: [script.content, template.code, 'component.ssrRender = ssrRender; export default component;'].join('\n') };
                });
            },
        }],
    });
    const source = bundle.outputFiles[0].text + '\n//# sourceURL=payments-promo-component.mjs';
    const module = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
    Payments = module.Payments;
    api = module.telegramMiniAppApi;
    endpoints = module.telegramMiniAppEndpoints;
});

beforeEach(async () => {
    const values = new Map([
        ['telegram-mini-app-token', 'test-token'],
        ['telegram-mini-app-session-mode', 'public'],
    ]);
    const storage = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: (key) => values.delete(key),
    };
    profileLoads = 0;
    window.localStorage = storage;
    window.sessionStorage = storage;
    window.axios = { get: async () => {
        profileLoads += 1;
        return { data: { subscription_expires_at: '2027-01-01', balance: 80 } };
    } };
    requests = [];
    respond = (url, payload) => url === endpoints.previewPromoCode ? { ...quotes[payload.month] } : { status: 'activated' };
    api.defaults.adapter = async (config) => {
        let data;
        if (config.method === 'get') {
            assert.equal(config.url, endpoints.subscriptionPackages);
            data = { data: packages };
        } else {
            const payload = JSON.parse(config.data);
            requests.push({ url: config.url, payload, authorization: config.headers.get('Authorization') });
            data = await respond(config.url, payload);
        }
        return { data, status: 200, statusText: 'OK', headers: {}, config };
    };
    app = renderer.createApp({
        setup() {
            view = Payments.setup({}, { expose() {} });
            return () => null;
        },
    });
    app.mount({});
    await flushRequests();
    assert.equal(view.state.value, 'ready');
    await view.openPackageSelectFor('PERSONAL');
    view.selectPackage(1);
});

afterEach(() => app?.unmount());
after(() => {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
});

test('promo preview uses the authenticated client and server totals for every paid duration', async () => {
    await applyPromo();
    for (const month of [1, 3, 6, 12]) {
        view.selectPackage(month);
        assert.equal(view.appliedPromo.value.price, quotes[month].price);
        assert.equal(view.marketingPrice(view.selectedPackage.value), view.formatPrice(quotes[month].payable_now));
    }
    assert.deepEqual(requests, [1, 3, 6, 12].map((month) => ({
        url: endpoints.previewPromoCode, payload: { month, promo_code: 'TOLSTYD' }, authorization: 'Bearer test-token',
    })));
    const html = await renderPayments();
    assert.match(html, /Стоимость подписки 173,25 ₽/);
    assert.match(html, /Стоимость подписки 2\s164,25 ₽/);
    assert.match(html, /53,25 ₽/);
    assert.match(html, /Скидка 20% на подписку/);
    assert.match(html, /id="checkout-promo-benefit"[^>]*class="tg-promo-benefit"/);
    assert.match(html, /readonly/);
    assert.doesNotMatch(html, />\s*Применить\s*</);
    assert.match(html, /aria-label="Очистить промокод"/);
    assert.doesNotMatch(html, /Убрать промокод|checkout-promo-hint/);
    assert.match(html, /class="tg-section__subtitle"[^>]*>Сумма к оплате уже учитывает доступный баланс и скидки\./);
    assert.ok(html.indexOf('id="checkout-promo-code"') < html.indexOf('tg-list-card--button'));
});

test('editing a code and restoring its previous value requires a new preview', async () => {
    await applyPromo();
    view.promoCode.value = 'OTHER';
    view.promoCode.value = ' tolstyd ';
    assert.equal(view.appliedPromo.value, null);
    assert.equal(view.mustApplyPromo.value, true);
    await view.buySubscription();
    assert.equal(requests.length, 4);
    await view.applyPromo();
    await view.buySubscription();
    assert.equal(requests.at(-1).payload.promo_code, 'TOLSTYD');
});

test('switching paid packages reuses each package quote and sends the selected duration at checkout', async () => {
    await applyPromo();
    view.selectPackage(3);
    assert.equal(view.appliedPromo.value.price, quotes[3].price);
    assert.equal(view.mustApplyPromo.value, false);
    await view.buySubscription();
    assert.equal(requests.length, 5);
    assert.equal(requests.at(-1).payload.month, 3);
    assert.equal(requests.at(-1).payload.promo_code, 'TOLSTYD');
});

test('clearing an applied promo restores every regular price and the apply button', async () => {
    await applyPromo();
    view.promoCode.value = '';
    assert.equal(view.hasAppliedPromo.value, false);
    for (const item of packages.filter((item) => !item.is_trial)) {
        assert.equal(view.promoForPackage(item), null);
        assert.equal(view.marketingPrice(item), view.formatPrice(item.payable_now));
    }
    const html = await renderPayments();
    assert.match(html, />\s*Применить\s*</);
    assert.doesNotMatch(html, /readonly|id="checkout-promo-benefit"/);
});

test('a refreshed package list invalidates all cached promo prices', async () => {
    await applyPromo();
    view.packages.value = [...view.packages.value];
    assert.equal(view.hasAppliedPromo.value, false);
    assert.equal(view.mustApplyPromo.value, true);
    await view.buySubscription();
    assert.equal(requests.length, 4);
});

test('a failed package preview waits for the whole batch and leaves all prices unapplied', async () => {
    const pending = deferred();
    respond = (url, payload) => {
        if (payload.month === 3) {
            throw { response: { status: 422, data: { message: 'Промокод недействителен.' } } };
        }
        if (payload.month === 12) return pending.promise;
        return { ...quotes[payload.month] };
    };
    view.promoCode.value = 'TOLSTYD';
    const preview = view.applyPromo();
    await flushRequests();
    assert.equal(view.previewingPromo.value, true);
    assert.equal(view.hasAppliedPromo.value, false);
    await view.applyPromo();
    await view.buySubscription();
    assert.equal(requests.length, 4);
    pending.resolve({ ...quotes[12] });
    await preview;
    assert.equal(view.previewingPromo.value, false);
    assert.equal(view.promoError.value, 'Промокод недействителен.');
    for (const item of packages.filter((item) => !item.is_trial)) {
        assert.equal(view.promoForPackage(item), null);
        assert.equal(view.marketingPrice(item), view.formatPrice(item.payable_now));
    }
    assert.match(await renderPayments(), />\s*Применить\s*</);
});

test('late preview responses cannot restore a quote after the input changes back', async () => {
    const pending = deferred();
    respond = () => pending.promise;
    view.promoCode.value = 'TOLSTYD';
    const preview = view.applyPromo();
    await view.applyPromo();
    await view.buySubscription();
    await flushRequests();
    assert.equal(requests.length, 4);
    view.promoCode.value = 'OTHER';
    view.promoCode.value = 'TOLSTYD';
    pending.resolve({ ...quote });
    await preview;
    assert.equal(view.appliedPromo.value, null);
    assert.equal(view.previewingPromo.value, false);
});

test('late preview errors are ignored after the package list is refreshed', async () => {
    const pending = deferred();
    respond = () => pending.promise;
    view.promoCode.value = 'TOLSTYD';
    const preview = view.applyPromo();
    view.packages.value = [...view.packages.value];
    pending.reject({ response: { status: 422, data: { message: 'Срок промокода истёк.' } } });
    await preview;
    assert.equal(view.promoError.value, '');
    assert.equal(view.appliedPromo.value, null);
});

test('field validation errors appear inline and clearing the code allows regular checkout', async () => {
    respond = () => { throw { response: { status: 422, data: {
        message: 'Validation failed.', errors: { promo_code: ['Промокод содержит недопустимые символы.'] },
    } } }; };
    await applyPromo();
    assert.equal(view.promoError.value, 'Промокод содержит недопустимые символы.');
    assert.match(await renderPayments(), /id="checkout-promo-error"[^>]*role="alert"/);
    view.promoCode.value = '';
    assert.equal(view.promoError.value, '');
    assert.equal(view.mustApplyPromo.value, false);
    assert.doesNotMatch(await renderPayments(), /aria-label="Очистить промокод"/);
    respond = () => ({ status: 'activated' });
    await view.buySubscription();
    assert.equal('promo_code' in requests.at(-1).payload, false);
    assert.equal(view.screen.value, 'activated');
});

test('duplicate checkout and preview submissions are blocked while payment is pending', async () => {
    await applyPromo();
    const pending = deferred();
    respond = () => pending.promise;
    const checkout = view.buySubscription();
    await view.buySubscription();
    await view.applyPromo();
    await flushRequests();
    assert.equal(requests.length, 5);
    assert.deepEqual(requests[4].payload, {
        month: 1, return_url: window.location.href, purchase_type: 'PERSONAL', promo_code: 'TOLSTYD',
    });
    pending.resolve({ status: 'activated' });
    await checkout;
    assert.equal(view.screen.value, 'activated');
    assert.equal(view.payingMonth.value, null);
    assert.equal(profileLoads, 2);
});

test('a fully covered promo purchase offers immediate activation', async () => {
    respond = (url) => url === endpoints.previewPromoCode
        ? { ...quote, benefit: 'fixed_discount', value: 200, discount_amount: 200, price: 0, payable_now: 0 }
        : { status: 'activated' };
    await applyPromo();
    assert.equal(view.marketingPrice(view.selectedPackage.value), '0 ₽');
    assert.match(await renderPayments(), /Активировать подписку/);
    await view.buySubscription();
    assert.equal(view.screen.value, 'activated');
    assert.equal(requests.at(-1).payload.promo_code, 'TOLSTYD');
    assert.equal(profileLoads, 2);
});

test('YooKassa redirect and provider amount are preserved after promo checkout', async () => {
    await applyPromo();
    respond = () => ({ confirmation_url: 'https://yookassa.example/pay', deposit_amount: 51.5 });
    await view.buySubscription();
    assert.equal(view.screen.value, 'payment-link');
    assert.equal(view.paymentResult.value.confirmation_url, 'https://yookassa.example/pay');
    assert.match(await renderPayments(), /51,5 ₽/);
});

test('checkout rejection invalidates the promo and shows its domain error by the field', async () => {
    await applyPromo();
    respond = () => { throw { response: { status: 422, data: { message: 'Вы уже использовали этот промокод.' } } }; };
    await view.buySubscription();
    assert.equal(view.promoError.value, 'Вы уже использовали этот промокод.');
    assert.equal(view.appliedPromo.value, null);
    assert.equal(view.mustApplyPromo.value, true);
    await view.buySubscription();
    assert.equal(requests.length, 5);
});

test('trial and gift checkout omit promos and keep their existing success paths', async () => {
    await applyPromo();
    view.selectPackage(0);
    assert.equal(view.isPromoAvailable.value, false);
    assert.doesNotMatch(await renderPayments(), /id="checkout-promo-code"/);
    await view.buySubscription();
    assert.deepEqual(requests.at(-1).payload, { month: 0, return_url: window.location.href, purchase_type: 'PERSONAL' });
    assert.equal(view.screen.value, 'activated');

    await view.openPackageSelectFor('GIFT');
    view.promoCode.value = 'TOLSTYD';
    assert.equal(view.isPromoAvailable.value, false);
    assert.doesNotMatch(await renderPayments(), /id="checkout-promo-code"/);
    respond = () => ({ status: 'gift_code_created' });
    await view.buySubscription();
    assert.deepEqual(requests.at(-1).payload, { month: 12, return_url: window.location.href, purchase_type: 'GIFT' });
    assert.equal(view.screen.value, 'gift-created');
});

test('the gift caption describes all five benefits using the server campaign value', () => {
    const cases = [
        ['balance_deposit', 200, 'Пополнение баланса для оплаты 200 ₽'],
        ['fixed_discount', 200, 'Скидка до 200 ₽ на подписку'],
        ['percentage_discount', 20, 'Скидка 20% на подписку'],
        ['bonus_days', 5, 'Дополнительные дни подписки — 5'],
        ['balance_cashback', 200, 'На баланс после оплаты 200 ₽'],
    ];
    for (const [benefit, value, expected] of cases) {
        assert.equal(view.promoBenefitText({ benefit, value, discount_amount: 75 }), expected);
    }
});
