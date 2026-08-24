# Multi-stage production image for the NestJS API.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/api ./apps/api

# Generate Prisma client
RUN npm run db:generate --workspace=apps/api

# Build application
RUN npm run build --workspace=apps/api

# Compile the one-time bootstrap seed without carrying TypeScript tooling
# into the runtime image.
WORKDIR /app/apps/api
RUN npx tsc prisma/seed.ts --module commonjs --target ES2021 --esModuleInterop --skipLibCheck --outDir .seed

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install only runtime dependencies. Prisma's generated engine is copied below.
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm ci --omit=dev --workspace=apps/api --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/.seed ./seed

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/v1/health/ping', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "apps/api/dist/main.js"]
