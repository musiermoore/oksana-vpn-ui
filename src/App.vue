<script setup>
import { computed } from 'vue';
import { currentRoute } from './lib/navigation';
import Home from './Pages/TelegramApp/Home.vue';
import Login from './Pages/TelegramApp/Login.vue';
import Register from './Pages/TelegramApp/Register.vue';
import Payments from './Pages/TelegramApp/Payments.vue';
import WireGuard from './Pages/TelegramApp/WireGuard.vue';
import Vless from './Pages/TelegramApp/Vless.vue';
import VlessWhiteList from './Pages/TelegramApp/VlessWhiteList.vue';
import Help from './Pages/TelegramApp/Help.vue';
import Chats from './Pages/TelegramApp/Chats.vue';
import Support from './Pages/TelegramApp/Support.vue';
import SupportShow from './Pages/TelegramApp/SupportShow.vue';
import Giveaway from './Pages/TelegramApp/Giveaway.vue';
import Referrals from './Pages/TelegramApp/Referrals.vue';

const pages = {
    '/': Home,
    '/login': Login,
    '/register': Register,
    '/payments': Payments,
    '/wireguard': WireGuard,
    '/vless': Vless,
    '/vless-wl': VlessWhiteList,
    '/help': Help,
    '/chats': Chats,
    '/support': Support,
    '/giveaway': Giveaway,
    '/referrals': Referrals,
};

const page = computed(() => currentRoute.value.pathname.match(/^\/support\/\d+$/)
    ? SupportShow
    : pages[currentRoute.value.pathname] ?? null);
const pageKey = computed(() => `${currentRoute.value.pathname}${currentRoute.value.search}`);
</script>

<template>
    <component :is="page" v-if="page" :key="pageKey" />
    <main v-else class="tg-app"><section class="tg-state-card"><h1>Страница не найдена</h1><a href="/">На главную</a></section></main>
</template>
