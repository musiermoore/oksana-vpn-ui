<script setup>
import { computed, onMounted, ref } from 'vue';
import AppIcon from '../../Shared/AppIcon.vue';
import TelegramMiniAppFrame from '../../Shared/TelegramMiniAppFrame.vue';
import { navigate } from '../../lib/navigation';
import {
    ensureTelegramAppSession,
    getTelegramAppToken,
    normalizeTelegramAppError,
    redirectFromTelegramStartParam,
    setTelegramAppToken,
} from '../../lib/telegramMiniApp';
import {
    telegramMiniAppApi,
    telegramMiniAppApiEndpoint,
    telegramMiniAppEndpoints,
    telegramMiniAppRoutes,
} from '../../lib/telegramMiniAppApi';

const state = ref('loading');
const loadError = ref('');
const login = ref('');
const password = ref('');
const showPassword = ref(false);
const submitting = ref(false);
const error = ref('');
const success = ref(false);
const loginError = ref('');
const passwordError = ref('');

const passwordBytes = computed(() => new TextEncoder().encode(password.value).length);

const validate = () => {
    loginError.value = '';
    passwordError.value = '';

    if (!/^[A-Za-z0-9._-]{3,64}$/.test(login.value)) {
        loginError.value = 'Логин должен содержать от 3 до 64 символов: латинские буквы, цифры, точку, дефис или подчёркивание.';
    }

    if (passwordBytes.value < 8 || passwordBytes.value > 72) {
        passwordError.value = 'Пароль должен занимать от 8 до 72 байт в UTF-8.';
    }

    return !loginError.value && !passwordError.value;
};

const submit = async () => {
    error.value = '';
    success.value = false;

    if (!validate()) return;

    submitting.value = true;
    try {
        await telegramMiniAppApi.put(
            telegramMiniAppApiEndpoint(telegramMiniAppEndpoints.authCredentials),
            { login: login.value, password: password.value },
        );
        success.value = true;
    } catch (requestError) {
        const status = requestError?.response?.status;
        if (status === 409) {
            error.value = 'Этот логин уже занят. Выберите другой.';
        } else if (status === 401 || status === 419) {
            setTelegramAppToken('');
            navigate(telegramMiniAppRoutes.login, { replace: true });
        } else {
            error.value = normalizeTelegramAppError(requestError, 'Не удалось сохранить данные для входа. Попробуйте ещё раз.');
        }
    } finally {
        password.value = '';
        showPassword.value = false;
        submitting.value = false;
    }
};

const retry = () => window.location.reload();

onMounted(async () => {
    if (redirectFromTelegramStartParam(telegramMiniAppRoutes)) return;

    try {
        await ensureTelegramAppSession({
            authUrl: telegramMiniAppApiEndpoint(telegramMiniAppEndpoints.authTelegram),
            profileUrl: telegramMiniAppApiEndpoint(telegramMiniAppEndpoints.profile),
        });
        if (getTelegramAppToken() === '') {
            navigate(telegramMiniAppRoutes.login, { replace: true });
            return;
        }
        state.value = 'ready';
    } catch (requestError) {
        state.value = 'error';
        loadError.value = normalizeTelegramAppError(requestError, 'Не удалось проверить вход в аккаунт.');
    }
});
</script>

<template>
    <TelegramMiniAppFrame
        title="Данные для входа"
        description="Настройте вход по логину и паролю."
    >
        <section v-if="state === 'loading'" class="tg-section">
            <div class="tg-skeleton tg-skeleton--hero"></div>
            <div class="tg-skeleton tg-skeleton--row"></div>
        </section>

        <section v-else-if="state === 'error'" class="tg-state-card tg-state-card--danger">
            <div class="tg-state-card__icon"><AppIcon name="circleExclamation" /></div>
            <h2>Не удалось открыть настройки входа</h2>
            <p>{{ loadError }}</p>
            <button class="tg-button" type="button" @click="retry">Повторить</button>
        </section>

        <section v-else class="tg-section">
            <div class="tg-page-header__copy">
                <h2>Логин и пароль</h2>
                <p>Задайте логин и пароль для входа в аккаунт.</p>
            </div>

            <div v-if="success" class="tg-status-card tg-status-card--success" role="status" aria-live="polite">
                <div class="tg-status-card__top">
                    <div>
                        <div class="tg-status-card__title">Данные для входа сохранены</div>
                        <div class="tg-status-card__meta">Теперь используйте выбранные логин и пароль на странице входа.</div>
                    </div>
                    <div class="tg-status-card__icon"><AppIcon name="circleCheck" /></div>
                </div>
            </div>

            <form class="tg-surface-card tg-stack" @submit.prevent="submit">
                <label class="tg-field" for="credentials-login">
                    <span class="tg-field__label">Логин</span>
                    <input
                        id="credentials-login"
                        v-model="login"
                        class="tg-input"
                        type="text"
                        autocomplete="username"
                        minlength="3"
                        maxlength="64"
                        autocapitalize="none"
                        spellcheck="false"
                        :aria-invalid="Boolean(loginError)"
                        :aria-describedby="loginError ? 'credentials-login-error' : undefined"
                        required
                        @input="loginError = ''; success = false"
                    >
                    <span v-if="loginError" id="credentials-login-error" class="tg-error" role="alert">{{ loginError }}</span>
                </label>

                <label class="tg-field" for="credentials-password">
                    <span class="tg-field__label">Пароль</span>
                    <div class="credentials-password-field">
                        <input
                            id="credentials-password"
                            v-model="password"
                            class="tg-input"
                            :type="showPassword ? 'text' : 'password'"
                            autocomplete="new-password"
                            :aria-invalid="Boolean(passwordError)"
                            :aria-describedby="passwordError ? 'credentials-password-error' : undefined"
                            required
                            @input="passwordError = ''; success = false"
                        >
                        <button
                            class="tg-icon-button credentials-password-toggle"
                            type="button"
                            :aria-pressed="showPassword"
                            :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'"
                            @click="showPassword = !showPassword"
                        >
                            <AppIcon :name="showPassword ? 'eyeSlash' : 'eye'" />
                        </button>
                    </div>
                    <span v-if="passwordError" id="credentials-password-error" class="tg-error" role="alert">{{ passwordError }}</span>
                </label>

                <p v-if="error" class="tg-error" role="alert">{{ error }}</p>

                <button class="tg-button" type="submit" :disabled="submitting">
                    <AppIcon name="key" />
                    {{ submitting ? 'Сохраняем...' : 'Сохранить данные' }}
                </button>
            </form>
        </section>
    </TelegramMiniAppFrame>
</template>

<style scoped>
.credentials-password-field {
    position: relative;
}

.credentials-password-field .tg-input {
    padding-right: 54px;
}

.credentials-password-toggle {
    position: absolute;
    top: 50%;
    right: 6px;
    display: grid;
    width: 36px;
    min-width: 36px;
    height: 36px;
    min-height: 36px;
    place-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--tg-text-muted);
    transform: translateY(-50%);
}
</style>
