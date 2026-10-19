import './css/base.css';
import './css/telegram-mini-app.css';
import axios from 'axios';
import { createApp } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { getClientTimeZone } from './lib/timezone';
import App from './App.vue';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.headers.common['X-Client-Timezone'] = getClientTimeZone();

createApp(App).component('FontAwesomeIcon', FontAwesomeIcon).mount('#app');
