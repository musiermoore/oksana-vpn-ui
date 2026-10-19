# OksanaVPN mini app UI

Standalone Vue 3 single page app copied from the Laravel mini app. The Laravel pages and endpoints remain available for rollback.

## Local development

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the Laravel origin plus `/telegram-app`.
2. Run `npm ci` and `npm run dev`.
3. Run `npm test` and `npm run build` before deployment.

For Docker deployment, set `VITE_API_BASE_URL` in `.env` and run `docker compose up -d --build`. The container serves HTTP on `${UI_PORT:-8080}`; terminate HTTPS for `public.oksana1984.ru` at the existing reverse proxy. The API URL is baked into the frontend during the image build, so rebuild after changing it.

Deploy `dist/` on `https://public.oksana1984.ru` with an HTML fallback to `index.html` for `/payments`, `/support/{id}`, and the other client routes. Do not proxy `/telegram-app/*` through the UI server; calls go to the backend address in `VITE_API_BASE_URL`.

## Domain cutover and rollback

Keep the existing Telegram mini app URL pointed at the Laravel app while testing the new UI at its direct URL. Verify Telegram authentication, public login, payments and return URL, support attachments, QR/download actions, and deep links. Then change the mini app URL in Telegram's configuration to `https://public.oksana1984.ru/`. If any flow fails, restore the previous Telegram mini app URL. The Laravel pages stay in place, so this rollback requires no code deployment.

The backend CORS configuration accepts browser requests to `/telegram-app/*`. It uses bearer tokens, without cookies. The new frontend must be served over HTTPS for Telegram.
