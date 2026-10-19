# OksanaVPN mini app UI

Standalone Vue 3 single page app copied from the Laravel mini app. The Laravel pages and endpoints remain available for rollback.

## Local development

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the Laravel origin plus `/telegram-app`.
2. Run `npm ci` and `npm run dev`.
3. Run `npm test` and `npm run build` before deployment.

For Docker deployment on the existing server, copy `.env.production.example` to `.env` and run `docker compose up -d --build`. The container joins the `oksana-vpn` Docker network as `oksana-vpn-ui`; the existing Caddy proxy can route `public.oksana1984.ru` to `oksana-vpn-ui:80`. The API URL is baked into the frontend during the image build, so rebuild after changing it.

Serve the UI on `https://public.oksana1984.ru` with an HTML fallback to `index.html` for `/payments`, `/support/{id}`, and the other client routes. The Docker Nginx configuration supplies this fallback. Do not proxy `/telegram-app/*` through the UI server; calls go to the backend address in `VITE_API_BASE_URL`.

## Domain cutover and rollback

Keep the Laravel pages available while testing the new container. Verify Telegram authentication, public login, payments and return URL, support attachments, QR/download actions, and deep links. On the current server, Caddy routes `public.oksana1984.ru` to Laravel's `/public` pages; switch that host route to `oksana-vpn-ui:80` after checks. If any flow fails, restore the saved Caddyfile and reload Caddy. The Laravel pages stay in place, so rollback does not require a code deployment or a Telegram domain change.

The backend CORS configuration accepts browser requests to `/telegram-app/*`. It uses bearer tokens, without cookies. The new frontend must be served over HTTPS for Telegram.
