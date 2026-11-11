import axios from 'axios';
import { telegramAppHeaders } from './telegramMiniApp';
import { getClientTimeZone } from './timezone';
import { apiBaseUrlForPath } from './apiUrls';
import { VLESS_LINK_API_PATH } from './vlessLink';

export const BASE_API_URL = String(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
export const AUTH_API_URL = BASE_API_URL;

export const telegramMiniAppEndpoint = (path = '') => `${BASE_API_URL}/${String(path).replace(/^\/+/, '')}`;
export const telegramMiniAppApiEndpoint = (path = '') => {
    const normalizedPath = String(path).replace(/^\/+/, '');
    return `${apiBaseUrlForPath(normalizedPath, BASE_API_URL, AUTH_API_URL)}/${normalizedPath}`;
};
export const telegramMiniAppUrl = (path = '') => `/${String(path).replace(/^\/+|\/+$/g, '')}`.replace(/\/+$/, '') || '/';

export const resolveApiUrl = (url) => {
    if (/^https?:\/\//i.test(url)) return url;
    if (String(url).startsWith('/')) return new URL(url, new URL(BASE_API_URL, window.location.origin).origin).href;
    return telegramMiniAppApiEndpoint(url);
};

export const telegramMiniAppApi = axios.create({
    baseURL: `${BASE_API_URL}/`,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Timezone': getClientTimeZone(),
    },
});

telegramMiniAppApi.interceptors.request.use((config) => {
    if (config.url?.startsWith('/')) config.url = resolveApiUrl(config.url);
    Object.entries(telegramAppHeaders()).forEach(([key, value]) => {
        if (typeof config.headers?.set === 'function') config.headers.set(key, value);
        else config.headers = { ...(config.headers ?? {}), [key]: value };
    });
    return config;
});

export const telegramMiniAppRoutes = {
    login: '/login',
    credentials: '/credentials',
    profile: '/profile',
    register: '/register',
    home: '/',
    wireguard: '/wireguard',
    vless: '/vless',
    vless_wl: '/vless-wl',
    payments: '/payments',
    help: '/help',
    chats: '/chats',
    support: '/support',
    giveaway: '/giveaway',
    referrals: '/referrals',
};

export const telegramMiniAppEndpoints = {
    authTelegram: 'auth/telegram',
    authPassword: 'auth/login',
    authLogout: 'auth/logout',
    authCredentials: 'auth/credentials',
    authRegister: 'auth/register',
    profile: 'auth/me',
    diagnosticsBootstrap: 'diagnostics/bootstrap',
    subscriptionPackages: 'subscription-packages',
    claimReferral: 'referrals/claim',
    giveaway: 'giveaway/current',
    giveawaySummary: 'giveaway/summary',
    giveawayParticipate: 'giveaway/participate',
    payment: 'payments/subscriptions',
    activateSubscriptionCode: 'payments/subscription-codes/activate',
    wireguardConfigs: 'wireguard/configs',
    vlessLink: VLESS_LINK_API_PATH,
    vlessQrCode: 'vless/qr-code',
    vlessSendQr: 'vless/send-qr',
    vlessWhiteListLink: 'vless-wl/link',
    vlessWhiteListQrCode: 'vless-wl/qr-code',
    vlessWhiteListSendQr: 'vless-wl/send-qr',
    supportTickets: 'support/tickets',
    supportOptions: 'support/options',
};
