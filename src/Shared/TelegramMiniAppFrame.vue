<script setup>
import Head from './SpaHead.vue';
import Link from './SpaLink.vue';
import { currentRoute } from '../lib/navigation';
import { computed, onMounted, ref, watch } from 'vue';
import AppIcon from './AppIcon.vue';
import { telegramMiniAppRoutes } from '../lib/telegramMiniAppApi';

const THEME_STORAGE_KEY = 'telegram-mini-app-theme';

const props = defineProps({
    title: String,
    description: String,
    showNavigation: {
        type: Boolean,
        default: true,
    },
});

const isTelegramMiniApp = Boolean(window.Telegram?.WebApp?.initData);
const theme = ref('light');

const navItems = computed(() => ([
    { href: telegramMiniAppRoutes.home, label: 'Главная', icon: 'home', keys: ['/'], exact: true },
    { href: telegramMiniAppRoutes.wireguard, label: 'Конфиги', icon: 'shield', keys: ['/wireguard', '/vless', '/vless-wl'] },
    { href: telegramMiniAppRoutes.payments, label: 'Подписка', icon: 'receipt', keys: ['/payments'] },
    { href: telegramMiniAppRoutes.help, label: 'Помощь', icon: 'circleQuestion', keys: ['/help', '/support', '/chats'] },
    { href: telegramMiniAppRoutes.profile, label: 'Профиль', icon: 'users', keys: ['/profile'] },
]));

const currentPath = computed(() => currentRoute.value.pathname);
const themeLabel = computed(() => theme.value === 'dark' ? 'Светлая тема' : 'Тёмная тема');

const resolveInitialTheme = () => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
};

const isActive = (item) => item.keys.some((prefix) => (
    item.exact
        ? currentPath.value === prefix
        : currentPath.value === prefix || currentPath.value.startsWith(`${prefix}/`)
));

onMounted(() => {
    theme.value = resolveInitialTheme();
});

watch(theme, (value) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
    document.documentElement.style.colorScheme = value;
});

</script>

<template>
    <Head :title="title" />

    <div
        class="tg-app"
        :class="{
            'tg-app--browser-frame': !isTelegramMiniApp,
            'tg-app--browser-frame--with-nav': !isTelegramMiniApp && showNavigation,
        }"
        :data-theme="theme"
    >
        <div class="tg-shell">
            <header class="tg-topbar">
                <div class="tg-brand">
                    <div class="tg-brand__mark" aria-hidden="true">
                        <AppIcon name="shield" />
                    </div>

                    <div class="tg-brand__copy">
                        <h1>{{ title }}</h1>
                        <p>{{ description }}</p>
                    </div>
                </div>

                <button class="tg-icon-button tg-theme-toggle" type="button" :aria-label="themeLabel" @click="toggleTheme">
                    <AppIcon name="lightbulb" />
                </button>
            </header>

            <main class="tg-main">
                <slot />
            </main>
        </div>

        <nav v-if="showNavigation" class="tg-bottom-nav">
            <div class="tg-bottom-nav__grid">
                <Link
                    v-for="item in navItems"
                    :key="item.label"
                    :href="item.href"
                    class="tg-bottom-nav__item"
                    :class="{ 'is-active': isActive(item) }"
                >
                    <AppIcon :name="item.icon" />
                    <span class="tg-bottom-nav__label">{{ item.label }}</span>
                </Link>
            </div>
        </nav>
    </div>
</template>

<style scoped>
.tg-bottom-nav__item {
    position: relative;
}
</style>
