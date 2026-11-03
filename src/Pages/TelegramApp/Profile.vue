<script setup>
import { computed, onMounted, ref } from 'vue';
import AppIcon from '../../Shared/AppIcon.vue';
import TelegramMiniAppFrame from '../../Shared/TelegramMiniAppFrame.vue';
import Link from '../../Shared/SpaLink.vue';
import {
    ensureTelegramAppSession,
    getTelegramAppTelegramUserId,
    normalizeTelegramAppError,
    redirectFromTelegramStartParam,
} from '../../lib/telegramMiniApp';
import { telegramMiniAppApiEndpoint, telegramMiniAppEndpoints, telegramMiniAppRoutes } from '../../lib/telegramMiniAppApi';

const state = ref('loading');
const error = ref('');
const user = ref(null);

const telegramUsername = computed(() => {
    const username = String(user.value?.telegram_username ?? window.Telegram?.WebApp?.initDataUnsafe?.user?.username ?? '').trim().replace(/^@/, '');
    return username;
});

const telegramId = computed(() => String(
    user.value?.telegram_id
    ?? window.Telegram?.WebApp?.initDataUnsafe?.user?.id
    ?? getTelegramAppTelegramUserId()
    ?? '',
).trim());

const welcomeName = computed(() => telegramUsername.value ? `@${telegramUsername.value}` : telegramId.value);

const retry = () => window.location.reload();

onMounted(async () => {
    if (redirectFromTelegramStartParam(telegramMiniAppRoutes)) return;

    try {
        user.value = await ensureTelegramAppSession({
            authUrl: telegramMiniAppApiEndpoint(telegramMiniAppEndpoints.authTelegram),
            profileUrl: telegramMiniAppApiEndpoint(telegramMiniAppEndpoints.profile),
        });
        state.value = 'ready';
    } catch (requestError) {
        state.value = 'error';
        error.value = normalizeTelegramAppError(requestError, 'Не удалось открыть профиль.');
    }
});
</script>

<template>
    <TelegramMiniAppFrame title="Профиль" description="Информация о вашем аккаунте.">
        <section v-if="state === 'loading'" class="tg-section">
            <div class="tg-skeleton tg-skeleton--hero"></div>
            <div class="tg-skeleton tg-skeleton--row"></div>
        </section>

        <section v-else-if="state === 'error'" class="tg-state-card tg-state-card--danger">
            <div class="tg-state-card__icon"><AppIcon name="circleExclamation" /></div>
            <h2>Не удалось открыть профиль</h2>
            <p>{{ error }}</p>
            <button class="tg-button" type="button" @click="retry">Повторить</button>
        </section>

        <section v-else class="tg-section">
            <div class="tg-surface-card tg-stack">
                <div class="tg-page-header__copy">
                    <h2>Добро пожаловать<span v-if="welcomeName">, {{ welcomeName }}</span>!</h2>
                    <p v-if="telegramUsername && telegramId">Telegram ID: {{ telegramId }}</p>
                    <p v-else-if="!welcomeName">Не удалось определить Telegram username или ID.</p>
                </div>

                <Link :href="telegramMiniAppRoutes.credentials" class="tg-button">
                    <AppIcon name="key" />
                    <span>Данные для входа</span>
                </Link>
            </div>
        </section>
    </TelegramMiniAppFrame>
</template>
