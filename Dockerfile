# Production-ready Dockerfile for Next.js 15 with LangChain dependencies
# Multi-stage build: keeps image size small and secure

# Stage 1: Build dependencies and app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with peer dependency support
# Using --legacy-peer-deps for LangChain/Zod compatibility
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Stage 2: Runtime (minimal image with only production needs)
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install dumb-init for proper signal handling (PID 1)
RUN apk add --no-cache dumb-init

# Copy built Next.js files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 || process.exit(1))"

# Expose port (Render sets PORT env var dynamically)
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js in production mode (Render will override PORT via env var)
CMD ["npm", "run", "start"]
