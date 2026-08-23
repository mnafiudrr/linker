# --- base ---
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# --- dev (docker-compose dev profile, hot reload) ---
FROM base AS dev
ENV NODE_ENV=development
# Polling keeps file watching reliable across bind mounts.
ENV WATCHPACK_POLLING=true
COPY package.json package-lock.json ./
RUN npm ci
EXPOSE 3000
# Source is bind-mounted at runtime; node_modules/.next stay container-owned
# (see the anonymous volumes in docker-compose.yml).
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# --- deps: full install incl. devDependencies (drizzle-kit for migrations) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build ---
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- prod runner: minimal standalone output, non-root user ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]

# --- migrate: runs migrations then exits (compose service) ---
FROM build AS migrate
CMD ["npx", "drizzle-kit", "migrate"]
