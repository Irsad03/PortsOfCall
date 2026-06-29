# Stage 1: build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# npm install (not `npm ci`): the dependency tree pulls native optional deps
# (@napi-rs/wasm-runtime → @emnapi/*) whose nested optional deps npm cannot
# reliably pin in package-lock.json across platforms, which makes the strict
# `npm ci` sync check fail. `npm install` reconciles them at build time.
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
