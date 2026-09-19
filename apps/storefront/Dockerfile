# Build a minimal production image for the customer storefront.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/storefront/package.json ./apps/storefront/package.json
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci

COPY apps/storefront ./apps/storefront
COPY scripts ./scripts

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

WORKDIR /app/apps/storefront
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# The postbuild step places static/public assets inside the actual standalone runtime root.
COPY --from=builder /app/apps/storefront/.next/standalone ./

EXPOSE 3000
CMD ["sh", "-c", "if [ -f /app/apps/storefront/server.js ]; then exec node /app/apps/storefront/server.js; else exec node /app/server.js; fi"]
