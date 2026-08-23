# --- base ---
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# --- dev (used by docker-compose) ---
FROM base AS dev
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]

# --- prod runner (finalized in task 008) ---
FROM base AS runner
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
