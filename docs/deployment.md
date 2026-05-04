# Deployment Guide

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Access to the Naje Health backend GraphQL API

---

## Environment Variables

Create a `.env.local` file in the project root (this file is gitignored and never committed):

```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.najehealth.com/graphql
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GRAPHQL_ENDPOINT` | Yes | Full URL of the backend GraphQL endpoint |

> **Note:** The `NEXT_PUBLIC_` prefix exposes the variable to the browser bundle. Do not put secrets here.

---

## Local Production Build

```bash
npm install
npm run build
npm start
```

The app will be available at `http://localhost:3000`.

---

## Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Set the environment variable under **Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_GRAPHQL_ENDPOINT` → `https://api.najehealth.com/graphql`
4. Deploy. Vercel handles `npm run build` and `npm start` automatically.

Vercel detects Next.js and applies optimal settings (edge caching, ISR, image optimisation) with no extra configuration.

---

## Self-Hosted (Ubuntu / Debian)

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone and build

```bash
git clone <repo-url> /var/www/najehealth-front
cd /var/www/najehealth-front
npm ci --omit=dev
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_GRAPHQL_ENDPOINT
npm run build
```

### 3. Run with PM2

```bash
npm install -g pm2
pm2 start npm --name "najehealth-front" -- start
pm2 save
pm2 startup
```

The app listens on port 3000 by default. To use a different port:

```bash
PORT=8080 npm start
```

### 4. Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name najehealth.com www.najehealth.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable HTTPS with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d najehealth.com -d www.najehealth.com
```

---

## Docker

### Dockerfile

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_GRAPHQL_ENDPOINT
ENV NEXT_PUBLIC_GRAPHQL_ENDPOINT=$NEXT_PUBLIC_GRAPHQL_ENDPOINT
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

> Enable standalone output in `next.config.ts` to use this Dockerfile:
> ```ts
> const nextConfig: NextConfig = {
>   reactStrictMode: true,
>   output: "standalone",
> };
> ```

### Build and run

```bash
docker build \
  --build-arg NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.najehealth.com/graphql \
  -t najehealth-front .

docker run -p 3000:3000 najehealth-front
```

---

## Pre-deployment Checklist

- [ ] `NEXT_PUBLIC_GRAPHQL_ENDPOINT` points to the production API (not localhost)
- [ ] `npm run build` completes without errors
- [ ] `npx tsc --noEmit` passes (zero TypeScript errors)
- [ ] `npm run lint` passes (zero ESLint errors)
- [ ] HTTPS is configured on the domain
- [ ] Backend API is reachable from the deployment server
- [ ] CORS is configured on the backend to allow the frontend's origin

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Check formatting (Prettier) |
| `npm run format:write` | Auto-fix formatting |
| `npx tsc --noEmit` | Type-check without emitting files |
