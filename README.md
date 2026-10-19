# OksanaVPN mini app UI

Standalone Vue 3 single page app copied from the Laravel mini app. The Laravel pages and endpoints remain available for rollback.

## Local development

1. Copy `.env.example` to `.env`; set `VITE_API_BASE_URL` to the Laravel origin plus `/telegram-app` and `API_URL` to the separate auth API, for example `https://api.oksana1984.ru/api/v1`.
2. Run `npm ci` and `npm run dev`.
3. Run `npm test` and `npm run build` before deployment.

For Docker deployment on the existing server, copy `.env.production.example` to `.env` and run `docker compose up -d --build`. The container uses Caddy and joins the `oksana-vpn` Docker network as `oksana-vpn-ui`. It also listens at `http://194.147.215.202:8082/` for an external reverse proxy. The existing server proxy can route `public.oksana1984.ru` to `oksana-vpn-ui:80`. Both API URLs are baked into the frontend during the image build, so rebuild after changing either one.

Serve the UI on `https://public.oksana1984.ru` with an HTML fallback to `index.html` for `/payments`, `/support/{id}`, and the other client routes. The Docker Caddy configuration supplies this fallback. Do not proxy `/telegram-app/*` through the UI server; calls go to the backend address in `VITE_API_BASE_URL`.

## Domain cutover and rollback

Keep the Laravel pages available while testing the new container. Verify Telegram authentication, public login, payments and return URL, support attachments, QR/download actions, and deep links. On the current server, Caddy routes `public.oksana1984.ru` to `oksana-vpn-ui:80`, while `/build/*` still reaches Laravel for older open tabs. The deployed proxy config is versioned in `deploy/Caddyfile`; running the proxy's interactive `scripts/setup-proxy.sh` replaces its Caddyfile, so deploy the versioned config again after using that generator. The previous Caddy configuration is saved at `/var/apps/oksana-vpn-proxy/Caddyfile.pre-spa-20261019`. If a flow fails, copy that file to `/var/apps/oksana-vpn-proxy/Caddyfile` and run `docker exec oksana-vpn-caddy caddy reload --config /etc/caddy/Caddyfile`. The Telegram bot menu now opens `https://public.oksana1984.ru/`; its prior setting is saved at `/var/apps/wireguard-vpn-app/storage/telegram-menu.pre-spa-20261019.json` and can be restored with Telegram's `setChatMenuButton` API. The Laravel pages remain available. Telegram's separate Main Mini App URL is configured in BotFather and should also be checked there.

The backend CORS configuration accepts browser requests to `/telegram-app/*`. Telegram auth and profile calls use `API_URL`; other mini-app requests use `VITE_API_BASE_URL`. Existing public account login, registration, and legacy `/me` profile calls stay on Laravel until the new browser login is implemented. The Go auth API does not create new Telegram users, so first-time Telegram onboarding still calls Laravel once before retrying Go auth. Both APIs use bearer tokens, without cookies. The frontend must be served over HTTPS for Telegram.

## Git push deployment

The bare repository is `/var/repositories/oksana-vpn-ui.git`, with a checkout in `/var/apps/oksana-vpn-ui`. Its `post-receive` hook is versioned in `deploy/post-receive` and deploys pushes to `main` with Docker Compose. The server keeps its untracked `.env` in the checkout. Push with `git push server main`; the hook builds the image, recreates the UI container, and checks its health and IP endpoint. The IP endpoint uses plain HTTP for the reverse proxy to terminate HTTPS.
