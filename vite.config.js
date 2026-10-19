import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    envPrefix: ['VITE_', 'API_URL'],
    server: { host: '0.0.0.0' },
    preview: { host: '0.0.0.0' },
});
