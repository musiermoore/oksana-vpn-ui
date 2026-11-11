<script setup>
import Head from '../../Shared/SpaHead.vue';
import { navigate } from '../../lib/navigation';
import { onMounted, ref } from 'vue';
import AppIcon from '../../Shared/AppIcon.vue';
import TelegramMiniAppFrame from '../../Shared/TelegramMiniAppFrame.vue';
import {
    loginTelegramAppAndRedirect,
    normalizeTelegramAppError,
    setTelegramAppTelegramUserId,
    setTelegramAppToken,
    setTelegramAppSessionMode,
    setTelegramAppAuthSource,
    openTelegramExternalLink,
} from '../../lib/telegramMiniApp';
import { telegramMiniAppApi, telegramMiniAppApiEndpoint, telegramMiniAppEndpoints, telegramMiniAppRoutes } from '../../lib/telegramMiniAppApi';
import { telegramCommunityLinks } from '../../lib/telegramChatLinks';

const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
const telegramLogin = String(telegramUser?.username || telegramUser?.id || '').replace(/^@/, '');

const form = ref({
    login: telegramLogin,
    password: '',
});
const processing = ref(false);
const processingTelegram = ref(false);
const processingOidc = ref(false);
const error = ref('');
const isTelegramMiniApp = Boolean(window.Telegram?.WebApp?.initData);
const isDesktopLogin = new URLSearchParams(window.location.search).get('desktop') === '1';
const desktopOidcPendingKey = 'telegram-desktop-oidc-pending';
const communityLinks = telegramCommunityLinks(isTelegramMiniApp);

const encodeBase64Url = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';

    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return window.btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
};

const handleDesktopOidcTicket = (ticket) => {
    const encodedTicket = encodeBase64Url(ticket);
    const deepLink = new URL(`oksanavpn://auth/${encodedTicket}`);

    if (deepLink.protocol !== 'oksanavpn:' || deepLink.hostname !== 'auth' || deepLink.pathname.length <= 1) {
        throw new Error('Не удалось открыть приложение Oksana VPN. Скопируйте ссылку и попробуйте ещё раз.');
    }

    window.location.assign(deepLink.href);
};

const exchangeTelegramOidcTicket = async () => {
    const fragment = window.location.hash.replace(/^#/, '');
    const fragmentParams = new URLSearchParams(fragment);
    const ticket = fragmentParams.get('telegram_oidc_ticket')?.trim() ?? '';

    if (ticket === '') {
        if (isDesktopLogin) {
            if (window.sessionStorage.getItem(desktopOidcPendingKey) === '1') {
                window.sessionStorage.removeItem(desktopOidcPendingKey);
                error.value = 'Не удалось войти через Telegram. Вернитесь в приложение Oksana VPN и попробуйте ещё раз.';
            } else {
                submitTelegramOidc();
            }
        }

        return;
    }

    if (isDesktopLogin) {
        window.sessionStorage.removeItem(desktopOidcPendingKey);
    }

    fragmentParams.delete('telegram_oidc_ticket');
    const remainingFragment = fragmentParams.toString();
    const cleanUrl = `${window.location.pathname}${window.location.search}${remainingFragment ? `#${remainingFragment}` : ''}`;
    window.history.replaceState(window.history.state, '', cleanUrl);

    processingOidc.value = true;
    error.value = '';

    if (isDesktopLogin) {
        try {
            handleDesktopOidcTicket(ticket);
        } catch (requestError) {
            error.value = requestError?.message ?? 'Не удалось открыть приложение Oksana VPN.';
        } finally {
            processingOidc.value = false;
        }

        return;
    }

    try {
        const response = await telegramMiniAppApi.post(
            telegramMiniAppApiEndpoint('auth/telegram/oidc/exchange'),
            { ticket },
        );
        const token = response.data?.access_token ?? '';

        if (token === '') {
            throw new Error('Не удалось выполнить вход через Telegram.');
        }

        setTelegramAppToken(token);
        setTelegramAppSessionMode('public');
        setTelegramAppAuthSource(response.data?.source);
        setTelegramAppTelegramUserId('');
        navigate(telegramMiniAppRoutes.home);
    } catch (requestError) {
        error.value = requestError?.response?.data?.message ?? requestError?.message ?? 'Не удалось выполнить вход через Telegram.';
    } finally {
        processingOidc.value = false;
    }
};

const submitTelegramOidc = () => {
    try {
        const endpoint = new URL(telegramMiniAppApiEndpoint('auth/telegram/oidc/start'), window.location.href);

        if (isDesktopLogin) {
            const returnUrl = new URL(window.location.pathname, window.location.origin);

            if (returnUrl.protocol !== 'https:') {
                throw new Error('Вход из приложения Oksana VPN доступен только через защищённый HTTPS адрес.');
            }

            returnUrl.search = '?desktop=1';
            endpoint.searchParams.set('return_url', returnUrl.href);
            window.sessionStorage.setItem(desktopOidcPendingKey, '1');
        }

        window.location.assign(endpoint.href);
    } catch (requestError) {
        if (isDesktopLogin) {
            window.sessionStorage.removeItem(desktopOidcPendingKey);
        }

        error.value = requestError?.message ?? 'Не удалось начать вход через Telegram.';
    }
};

const submit = async () => {
    processing.value = true;
    error.value = '';

    try {
        const response = await telegramMiniAppApi.post(telegramMiniAppApiEndpoint(telegramMiniAppEndpoints.authPassword), form.value);
        const token = response.data?.access_token ?? response.data?.token ?? '';

        if (token === '') {
            throw new Error('Не удалось выполнить вход.');
        }

        setTelegramAppToken(token);
        setTelegramAppSessionMode('public');
        setTelegramAppAuthSource(response.data?.source);
        setTelegramAppTelegramUserId(response.data?.telegram_id ?? response.data?.user?.telegram_id ?? '');
        navigate(telegramMiniAppRoutes.home);
    } catch (requestError) {
        error.value = requestError?.response?.data?.message ?? requestError?.response?.data?.error ?? requestError?.message ?? 'Не удалось выполнить вход.';
    } finally {
        processing.value = false;
    }
};

const submitTelegram = async () => {
    processingTelegram.value = true;
    error.value = '';

    try {
        await loginTelegramAppAndRedirect({
            authUrl: telegramMiniAppApiEndpoint(telegramMiniAppEndpoints.authTelegram),
            homeUrl: telegramMiniAppRoutes.home,
        });
    } catch (requestError) {
        error.value = normalizeTelegramAppError(requestError, 'Не удалось выполнить вход через Telegram.');
    } finally {
        processingTelegram.value = false;
    }
};

onMounted(exchangeTelegramOidcTicket);
</script>

<template>
    <Head title="Вход" />

    <TelegramMiniAppFrame
        title="OksanaVPN"
        description="Вход в личный кабинет."
        :show-navigation="false"
    >
        <section class="tg-section">
            <div class="tg-page-header__copy">
                <h2>Вход</h2>
                <p>Используйте Telegram или логин и пароль от аккаунта.</p>
            </div>

            <form class="tg-surface-card tg-stack" @submit.prevent="submit">
                <button v-if="!isTelegramMiniApp" class="tg-button" type="button" :disabled="processingOidc || processingTelegram || processing" @click="submitTelegramOidc">
                    <AppIcon name="send" />
                    {{ processingOidc ? 'Завершаем вход...' : 'Войти через Telegram' }}
                </button>

                <button v-else class="tg-button" type="button" :disabled="processingOidc || processingTelegram || processing" @click="submitTelegram">
                    <AppIcon name="send" />
                    {{ processingTelegram ? 'Проверяем Telegram...' : 'Войти через Telegram' }}
                </button>

                <label class="tg-field">
                    <span class="tg-field__label">Логин</span>
                    <input
                        v-model="form.login"
                        class="tg-input"
                        type="text"
                        autocomplete="username"
                        required
                    >
                </label>

                <label class="tg-field">
                    <span class="tg-field__label">Пароль</span>
                    <input
                        v-model="form.password"
                        class="tg-input"
                        type="password"
                        autocomplete="current-password"
                        required
                    >
                </label>

                <button class="tg-button" type="submit" :disabled="processing">
                    <AppIcon name="key" />
                    {{ processing ? 'Проверяем...' : 'Войти' }}
                </button>

                <p v-if="error" class="tg-error">{{ error }}</p>
            </form>

            <section class="tg-section">
                <div class="tg-section__head">
                    <div>
                        <div class="tg-section__title">Сообщество</div>
                        <div class="tg-section__subtitle">Новости, общий чат и бот OksanaVPN.</div>
                    </div>
                </div>

                <div class="tg-inline-actions">
                    <button
                        v-for="item in communityLinks"
                        :key="item.title"
                        class="tg-button tg-button--secondary"
                        type="button"
                        @click="openTelegramExternalLink(item.url)"
                    >
                        <AppIcon name="chat" />
                        <span>{{ item.title }}</span>
                    </button>
                </div>
            </section>
        </section>
    </TelegramMiniAppFrame>
</template>
