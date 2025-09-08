# syntax=docker/dockerfile:1

# Builder stage: install all deps and build the web frontend
FROM node:20-alpine AS builder
WORKDIR /app
# Avoid heavy dev downloads during install (electron, playwright)
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package*.json ./
# Install all dependencies (including dev) for building
RUN npm install --no-audit --no-fund
# Copy the full repo to build both web and include server code for type references
COPY . .
# Build Vite frontend to dist/
RUN npm run build

# Runtime stage: production-only deps and run the server
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy server and remotion entry (server uses src/remotion for rendering)
COPY server ./server
COPY src ./src

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Expose and run
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/index.mjs"]

