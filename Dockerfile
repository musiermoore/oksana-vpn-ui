FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL
ARG API_URL
RUN test -n "$VITE_API_BASE_URL" && test -n "$API_URL" && VITE_API_BASE_URL="$VITE_API_BASE_URL" API_URL="$API_URL" npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
