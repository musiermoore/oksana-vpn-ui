# AGENTS

This is the standalone Vue 3 SPA for the OksanaVPN Telegram mini app. The Laravel backend remains in `../wireguard-vpn-app`.

- Preserve the existing Telegram, public login, payment, gift code, config, giveaway, referral, and support flows when editing pages.
- API requests use `VITE_API_BASE_URL`; UI routes live at the site root. Keep them separate.
- Keep the old Laravel mini app pages in place until the new domain has been verified and the team deliberately retires them.
- Run `npm test` and `npm run build` before finishing frontend changes.
- When API behavior changes, follow `../wireguard-vpn-app/AGENTS.md` and its referenced flow documents.
